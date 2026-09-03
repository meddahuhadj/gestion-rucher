import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Download, Upload, KeyRound, Users, Copy, UserMinus, UserCog, LogOut, Hand } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useGlove } from '../../context/GloveContext';
import { isClickSoundEnabled, setClickSoundEnabled } from '../../utils/clickSound';
import { authApi, backupApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody, Button, Input, Select, ConfirmDialog } from '../../components/ui';

export const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const { active, members, myRole, removeMember, leaveWorkspace, transferOwner } = useWorkspace();
  const { glove, toggle: toggleGlove } = useGlove();
  const [clickSound, setClickSound] = useState(isClickSoundEnabled());
  const [copied, setCopied] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const fileInputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState(user?.currency || 'DZD');
  const [language, setLanguage] = useState(user?.language || 'ar');
  const [reminderDays, setReminderDays] = useState(user?.reminderDays || 1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const saveProfile = async (isPassword = false) => {
    setMessage('');
    setError('');
    try {
      const data = await authApi.updateProfile({
        name, email, currency, language, reminderDays: parseInt(reminderDays),
        ...(isPassword ? { password: currentPassword, newPassword } : {}),
      });
      updateUser(data);
      if (isPassword) { setCurrentPassword(''); setNewPassword(''); }
      setMessage('✅');
    } catch (e) {
      setError(e.response?.data?.message || 'Error');
    }
  };

  const changeLang = (code) => {
    setLanguage(code);
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  };

  const copyCode = () => {
    if (active?.code) {
      navigator.clipboard?.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!active) return;
    await removeMember(active.id, userId);
    setRemoveTarget(null);
  };

  const handleLeave = async () => {
    if (!active) return;
    await leaveWorkspace(active.id);
    setConfirmLeave(false);
  };

  const handleTransfer = async () => {
    if (!active || !transferTarget) return;
    await transferOwner(active.id, transferTarget.id);
    setTransferTarget(null);
  };

  const exportData = async () => {
    setMessage('');
    setError('');
    setBusy(true);
    try {
      const payload = await backupApi.export();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.download = `rucher-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.response?.data?.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const onFilePicked = (e) => {
    setMessage('');
    setError('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || parsed.format !== 'rucher-backup') {
          setError(t('settings.importBadFile'));
          return;
        }
        setPendingImport(parsed);
      } catch {
        setError(t('settings.importBadFile'));
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await backupApi.import(pendingImport);
      setPendingImport(null);
      setMessage(t('settings.importDone'));
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      setError(e.response?.data?.message || 'Error');
      setPendingImport(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title={t('settings.title')} icon={SettingsIcon} />

      {message && <p className="text-emerald-600 text-sm">{message}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {active && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-800 flex items-center gap-2 dark:text-stone-100">
              <Users className="h-4 w-4" /> {t('settings.workspace')}
              <span className="ms-auto text-xs px-2 py-0.5 rounded-full bg-honey-100 text-honey-700 font-medium dark:bg-honey-900/40 dark:text-honey-300">
                {myRole === 'OWNER' ? t('settings.roleOwner') : t('settings.roleMember')}
              </span>
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('settings.workspaceName')}</p>
              <p className="text-lg font-semibold text-stone-800 dark:text-stone-100">{active.name}</p>
            </div>

            {myRole === 'OWNER' && (
              <div>
                <p className="text-sm font-medium text-stone-700 mb-1 dark:text-stone-300">{t('settings.inviteCode')}</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg tracking-widest bg-honey-50 text-honey-700 px-4 py-2 rounded-lg dark:bg-honey-900/40 dark:text-honey-300">{active.code}</span>
                  <Button variant="secondary" onClick={copyCode}>
                    <Copy className="h-4 w-4" /> {copied ? t('common.copied') : t('common.copy')}
                  </Button>
                </div>
                <p className="text-xs text-stone-400 mt-2">{t('settings.inviteHint')}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-stone-700 mb-1 dark:text-stone-300">{t('settings.members')} ({members.length})</p>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800">
                    <span className="h-8 w-8 rounded-full bg-honey-200 flex items-center justify-center text-sm font-bold text-honey-700 dark:bg-honey-900/40 dark:text-honey-300">{m.name[0]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate dark:text-stone-100">{m.name}</p>
                      <p className="text-xs text-stone-400 truncate">{m.email}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 uppercase dark:bg-stone-700 dark:text-stone-300">
                      {m.role === 'OWNER' ? 'Admin' : 'Membre'}
                    </span>
                    {myRole === 'OWNER' && m.id !== user?.id && m.role !== 'OWNER' && (
                      <button
                        onClick={() => setTransferTarget(m)}
                        className="p-1.5 text-stone-400 hover:text-honey-600 hover:bg-honey-50 rounded-lg dark:hover:bg-stone-700"
                        title={t('settings.makeAdmin')}
                      >
                        <UserCog className="h-4 w-4" />
                      </button>
                    )}
                    {myRole === 'OWNER' && m.id !== user?.id && (
                      <button
                        onClick={() => setRemoveTarget(m)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-stone-700"
                        title={t('settings.removeMember')}
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <Button variant="danger" onClick={() => setConfirmLeave(true)}>
                <LogOut className="h-4 w-4" /> {t('settings.leaveWorkspace')}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title={t('settings.removeMember')}
        message={`${t('settings.removeMemberConfirm')} ${removeTarget?.name || ''}?`}
        confirmText={t('common.delete')}
        onConfirm={() => handleRemoveMember(removeTarget.id)}
        onClose={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        open={confirmLeave}
        title={t('settings.leaveWorkspace')}
        message={t('settings.leaveConfirm')}
        confirmText={t('settings.leaveWorkspace')}
        onConfirm={handleLeave}
        onClose={() => setConfirmLeave(false)}
      />

      <ConfirmDialog
        open={!!transferTarget}
        title={t('settings.makeAdmin')}
        message={`${t('settings.transferConfirm')} ${transferTarget?.name || ''}?`}
        confirmText={t('settings.makeAdmin')}
        onConfirm={handleTransfer}
        onClose={() => setTransferTarget(null)}
      />

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">👤 {t('settings.profile')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <Input label={t('settings.name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('settings.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label={t('settings.currency')} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {['DZD', 'MAD', 'EUR', 'USD', 'TND'].map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label={t('settings.language')} value={language} onChange={(e) => changeLang(e.target.value)}>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </Select>
            <Input type="number" label={t('settings.reminderDays')} value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} />
          </div>
          <Button onClick={() => saveProfile(false)}>{t('common.save')}</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 flex items-center gap-2 dark:text-stone-100"><Hand className="h-4 w-4" /> {t('settings.display')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-100">{t('glove.toggle')}</p>
              <p className="text-xs text-stone-400">{t('glove.hint')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={glove}
              onClick={toggleGlove}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                glove ? 'bg-honey-500' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  glove ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-100">{t('sound.toggle')}</p>
              <p className="text-xs text-stone-400">{t('sound.hint')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={clickSound}
              onClick={() => { const next = !clickSound; setClickSound(next); setClickSoundEnabled(next); }}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                clickSound ? 'bg-honey-500' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  clickSound ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 flex items-center gap-2 dark:text-stone-100"><KeyRound className="h-4 w-4" /> {t('settings.changePassword')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <Input type="password" label={t('settings.currentPassword')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input type="password" label={t('settings.newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Button onClick={() => saveProfile(true)}>{t('settings.changePassword')}</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">💾 {t('settings.data')}</h2></CardHeader>
        <CardBody className="space-y-5">
          <div className="space-y-2">
            <Button variant="secondary" onClick={exportData} disabled={busy}>
              <Download className="h-4 w-4" /> {busy ? t('settings.working') : t('settings.export')}
            </Button>
            <p className="text-xs text-stone-400">{t('settings.exportHint')}</p>
          </div>

          <div className="space-y-2 pt-1 border-t border-stone-100 dark:border-stone-800">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onFilePicked}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy || myRole !== 'OWNER'}
            >
              <Upload className="h-4 w-4" /> {t('settings.import')}
            </Button>
            <p className="text-xs text-stone-400">
              {myRole === 'OWNER' ? t('settings.importHint') : t('settings.importOwnerOnly')}
            </p>
          </div>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!pendingImport}
        title={t('settings.importTitle')}
        message={t('settings.importConfirm', { name: active?.name || '' })}
        confirmText={t('settings.import')}
        onConfirm={confirmImport}
        onClose={() => setPendingImport(null)}
      />
    </div>
  );
};
