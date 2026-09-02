import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToBase64, createPcmBlob, decodeAudioData, decodeBase64 } from './audio';
import { functionDeclarations, createToolHandler } from './tools';

const MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const API_KEY_STORAGE = 'gemini_api_key';

const buildSystemInstruction = ({ userName, workspaceName, currency, lang }) => {
  const today = new Date().toISOString().slice(0, 10);
  const langName = { fr: 'français', ar: 'arabe', en: 'anglais' }[lang] || 'français';
  return [
    `Tu es l'assistant vocal de "Nahala", une application de gestion de rucher (apiculture).`,
    `Utilisateur : ${userName || 'apiculteur'}. Espace de travail : ${workspaceName || 'non défini'}. Devise : ${currency || 'DZD'}. Date du jour : ${today}.`,
    `Réponds dans la langue de l'utilisateur (par défaut ${langName}). Sois bref, naturel et concret.`,
    `Tu peux consulter les données du rucher (ruches, travaux, inspections, récoltes, finances) et en créer via les outils fournis.`,
    `Les ruches sont désignées par leur NUMÉRO. Avant de créer ou modifier une donnée, reformule brièvement ce que tu vas faire et attends la confirmation, sauf si la demande est déjà explicite et complète.`,
    `Après une action réussie, confirme en une phrase courte. Si un outil renvoie une erreur, explique-la simplement.`,
    `Tu disposes aussi de la caméra quand l'utilisateur l'active : tu peux alors décrire un cadre, du couvain, une reine, etc.`,
  ].join(' ');
};

export function useAssistantSession({ userName, workspaceName, currency, lang, onChange } = {}) {
  const [hasApiKey, setHasApiKey] = useState(() => !!localStorage.getItem(API_KEY_STORAGE));
  const [status, setStatus] = useState('IDLE');
  const [transcriptions, setTranscriptions] = useState([]);
  const [actions, setActions] = useState([]);
  const [error, setError] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef(null);
  const r = useRef({
    session: null,
    audioStream: null,
    videoStream: null,
    ai: null,
    ctxIn: null,
    ctxOut: null,
    source: null,
    processor: null,
    frameInterval: null,
    activeSources: new Set(),
    nextStartTime: 0,
    curIn: '',
    curOut: '',
    canvas: null,
    closing: false,
  });

  const isActive = status !== 'IDLE' && status !== 'ERROR';

  const saveApiKey = useCallback((key) => {
    const trimmed = (key || '').trim();
    if (!trimmed) return;
    localStorage.setItem(API_KEY_STORAGE, trimmed);
    setHasApiKey(true);
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE);
    setHasApiKey(false);
  }, []);

  const pushTranscription = useCallback((role, text) => {
    if (!text) return;
    setTranscriptions((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text },
    ]);
  }, []);

  const stopVideo = useCallback(() => {
    const s = r.current;
    if (s.frameInterval) {
      clearInterval(s.frameInterval);
      s.frameInterval = null;
    }
    if (s.videoStream) {
      s.videoStream.getTracks().forEach((t) => t.stop());
      s.videoStream = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startVideoLoop = useCallback(async () => {
    const s = r.current;
    if (!s.session) return;
    try {
      s.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' },
      });
    } catch {
      s.videoStream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
    }
    if (!s.videoStream) {
      setError("Caméra indisponible");
      setCameraOn(false);
      return;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = s.videoStream;
      videoRef.current.play?.().catch(() => {});
    }
    if (!s.canvas) s.canvas = document.createElement('canvas');
    s.frameInterval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !s.session) return;
      const canvas = s.canvas;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob(
        async (blob) => {
          if (!blob || !s.session) return;
          const base64 = await blobToBase64(blob);
          try {
            s.session.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
          } catch {
            /* session closed */
          }
        },
        'image/jpeg',
        0.6,
      );
    }, 1000);
  }, []);

  const stop = useCallback(async () => {
    const s = r.current;
    s.closing = true;
    stopVideo();
    if (s.processor) {
      try { s.processor.disconnect(); } catch {}
      s.processor.onaudioprocess = null;
      s.processor = null;
    }
    if (s.source) {
      try { s.source.disconnect(); } catch {}
      s.source = null;
    }
    if (s.session) {
      try { s.session.close(); } catch {}
      s.session = null;
    }
    if (s.audioStream) {
      s.audioStream.getTracks().forEach((t) => t.stop());
      s.audioStream = null;
    }
    if (s.ctxIn) { try { await s.ctxIn.close(); } catch {} s.ctxIn = null; }
    if (s.ctxOut) { try { await s.ctxOut.close(); } catch {} s.ctxOut = null; }
    s.activeSources.forEach((src) => { try { src.stop(); } catch {} });
    s.activeSources.clear();
    s.nextStartTime = 0;
    s.curIn = '';
    s.curOut = '';
    s.closing = false;
    setCameraOn(false);
    setStatus('IDLE');
  }, [stopVideo]);

  const toolHandlerRef = useRef(null);

  const start = useCallback(async () => {
    if (isActive) return;
    const apiKey = localStorage.getItem(API_KEY_STORAGE);
    if (!apiKey) {
      setHasApiKey(false);
      return;
    }
    setError(null);
    setStatus('CONNECTING');
    const s = r.current;
    toolHandlerRef.current = createToolHandler({
      onChange: (entity) => {
        setActions((prev) => [
          ...prev,
          { id: `${Date.now()}`, entity, ts: Date.now() },
        ]);
        onChange?.(entity);
      },
    });

    try {
      const { GoogleGenAI } = await import('@google/genai');
      s.ctxIn = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      s.ctxOut = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      s.nextStartTime = 0;
      s.ai = new GoogleGenAI({ apiKey });
      s.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      s.session = await s.ai.live.connect({
        model: MODEL,
        callbacks: {
          onopen: () => {
            setStatus('LISTENING');
            s.source = s.ctxIn.createMediaStreamSource(s.audioStream);
            s.processor = s.ctxIn.createScriptProcessor(4096, 1, 1);
            s.processor.onaudioprocess = (e) => {
              if (!s.session) return;
              const pcm = createPcmBlob(e.inputBuffer.getChannelData(0));
              try { s.session.sendRealtimeInput({ media: pcm }); } catch {}
            };
            s.source.connect(s.processor);
            s.processor.connect(s.ctxIn.destination);
          },
          onmessage: async (message) => {
            if (message.toolCall?.functionCalls?.length) {
              for (const fc of message.toolCall.functionCalls) {
                let result;
                try {
                  result = await toolHandlerRef.current.handle(fc.name, fc.args || {});
                } catch (err) {
                  result = { error: err?.response?.data?.message || err?.message || 'Erreur' };
                }
                try {
                  s.session?.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result } },
                  });
                } catch {}
              }
            }

            const sc = message.serverContent;
            if (sc?.outputTranscription) s.curOut += sc.outputTranscription.text;
            if (sc?.inputTranscription) s.curIn += sc.inputTranscription.text;

            if (sc?.turnComplete) {
              pushTranscription('user', s.curIn.trim());
              pushTranscription('agent', s.curOut.trim());
              s.curIn = '';
              s.curOut = '';
              setStatus((cur) => (cur === 'SPEAKING' ? 'LISTENING' : cur));
            }

            const base64Audio = sc?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && s.ctxOut) {
              setStatus('SPEAKING');
              const ctx = s.ctxOut;
              s.nextStartTime = Math.max(s.nextStartTime, ctx.currentTime);
              const buffer = decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
              const src = ctx.createBufferSource();
              src.buffer = buffer;
              src.connect(ctx.destination);
              src.addEventListener('ended', () => s.activeSources.delete(src));
              src.start(s.nextStartTime);
              s.nextStartTime += buffer.duration;
              s.activeSources.add(src);
            }

            if (sc?.interrupted) {
              s.activeSources.forEach((src) => { try { src.stop(); } catch {} });
              s.activeSources.clear();
              s.nextStartTime = 0;
              setStatus('LISTENING');
            }
          },
          onerror: (e) => {
            if (s.closing) return;
            console.error('[assistant] error', e);
            setError(e?.message || 'Erreur de connexion');
            setStatus('ERROR');
            stop();
          },
          onclose: () => {
            if (!s.closing) stop();
          },
        },
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: buildSystemInstruction({ userName, workspaceName, currency, lang }),
          tools: [{ functionDeclarations }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });
    } catch (err) {
      console.error('[assistant] start failed', err);
      setError(err?.message || "Impossible de démarrer l'assistant (micro ou clé API).");
      setStatus('ERROR');
      stop();
    }
  }, [isActive, onChange, pushTranscription, stop, userName, workspaceName, currency, lang]);

  const toggleCamera = useCallback(async () => {
    if (!isActive) {
      setCameraOn((v) => !v); // pre-toggle before session (applied on next start)
      return;
    }
    if (cameraOn) {
      stopVideo();
      setCameraOn(false);
    } else {
      setCameraOn(true);
      await startVideoLoop();
    }
  }, [isActive, cameraOn, startVideoLoop, stopVideo]);

  const sendText = useCallback((text) => {
    const s = r.current;
    const value = (text || '').trim();
    if (!value || !s.session) return;
    pushTranscription('user', value);
    try {
      s.session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: value }] }],
        turnComplete: true,
      });
    } catch (e) {
      console.error('[assistant] sendText failed', e);
    }
  }, [pushTranscription]);

  const clearTranscriptions = useCallback(() => {
    setTranscriptions([]);
    setActions([]);
  }, []);

  // cleanup on unmount
  useEffect(() => () => { stop(); }, [stop]);

  return {
    hasApiKey, saveApiKey, clearApiKey,
    status, isActive, error,
    transcriptions, actions, clearTranscriptions,
    cameraOn, toggleCamera, videoRef,
    start, stop, sendText,
  };
}
