import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Plus, LogIn, Users } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Button, Input, Card, CardBody } from '../../components/ui';

export const WorkspacePage = () => {
  const { t } = useTranslation();
  const { workspaces, createWorkspace, joinWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError(t('workspace.nameRequired'));
    setBusy(true);
    setError('');
    try {
      const ws = await createWorkspace(name);
      if (ws) navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('workspace.error'));
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return setError(t('workspace.codeRequired'));
    setBusy(true);
    setError('');
    try {
      const ws = await joinWorkspace(code);
      if (ws) navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('workspace.error'));
    } finally {
      setBusy(false);
    }
  };

  const selectExisting = (id) => {
    localStorage.setItem('workspaceId', id);
    navigate('/');
  };

  const tabCls = (m) =>
    `flex-1 py-3 rounded-xl text-sm font-semibold transition ${
      mode === m ? 'bg-honey-600 text-white shadow' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-honey-50 via-amber-50 to-stone-100 flex items-center justify-center p-4 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="h-16 w-16 mx-auto mb-3 rounded-2xl bg-honey-500 flex items-center justify-center">
            <Hexagon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('appName')}</h1>
          <p className="text-stone-500 dark:text-stone-400">{t('tagline')} 🐝</p>
        </div>

        {workspaces.length > 0 && (
          <Card className="mb-6">
            <CardBody>
              <h2 className="font-semibold text-stone-700 flex items-center gap-2 mb-3 dark:text-stone-300">
                <Users className="h-4 w-4" /> {t('workspace.yourWorkspaces')}
              </h2>
              <div className="space-y-2">
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => selectExisting(w.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 hover:border-honey-400 hover:bg-honey-50 transition text-start dark:border-stone-700 dark:hover:bg-honey-900/30"
                  >
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-100">{w.name}</p>
                      <p className="text-xs text-stone-400">{w.members.length} {t('workspace.members')}</p>
                    </div>
                    <span className="text-xs font-mono text-honey-600 bg-honey-50 px-2 py-1 rounded-lg dark:text-honey-300 dark:bg-honey-900/40">{w.code}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <div className="flex gap-2 mb-5">
              <button className={tabCls('create')} onClick={() => setMode('create')}>
                <Plus className="h-4 w-4 inline me-1" /> {t('workspace.create')}
              </button>
              <button className={tabCls('join')} onClick={() => setMode('join')}>
                <LogIn className="h-4 w-4 inline me-1" /> {t('workspace.join')}
              </button>
            </div>

            {mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label={t('workspace.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('workspace.namePlaceholder')}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {busy ? t('common.loading') : t('workspace.createCta')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <Input
                  label={t('workspace.inviteCode')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="font-mono tracking-widest uppercase"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {busy ? t('common.loading') : t('workspace.joinCta')}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
