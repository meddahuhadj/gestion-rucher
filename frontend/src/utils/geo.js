// Géolocalisation navigateur — helpers partagés (widget en-tête + formulaire rucher).

const CACHE_KEY = 'geo';
const COORD_RE = /^\s*(-?\d{1,2}(?:\.\d+)?|-?[01]\d{2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

// "36.75381, 3.05880" -> { lat, lng }  (null si le texte n'est pas des coordonnées)
export const parseCoords = (str) => {
  const m = COORD_RE.exec(str || '');
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

export const formatCoords = (lat, lng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export const mapUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

export const getCachedGeo = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || null;
  } catch {
    return null;
  }
};

export const requestGeo = (opts = {}) =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          ts: Date.now(),
        };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(geo));
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent('nahala:geo', { detail: geo }));
        resolve(geo);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000, ...opts },
    );
  });
