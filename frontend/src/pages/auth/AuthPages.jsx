import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hexagon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';

const Toggle = ({ options, value, onChange }) => (
  <div className="flex bg-stone-100 rounded-lg p-1 w-fit mx-auto">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
          value === o.value ? 'bg-white text-honey-700 shadow-sm' : 'text-stone-500'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const AuthLayout = ({ children, mode }) => {
  const { t, i18n } = useTranslation();
  const options = [
    { value: 'ar', label: 'العربية' },
    { value: 'fr', label: 'FR' },
    { value: 'en', label: 'EN' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-honey-50 via-amber-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Toggle
            value={i18n.language}
            onChange={(v) => {
              i18n.changeLanguage(v);
              localStorage.setItem('lang', v);
            }}
            options={options}
          />
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-honey-500 flex items-center justify-center">
              <Hexagon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800">{t('appName')}</h1>
            <p className="text-stone-500">{t('tagline')} 🐝</p>
          </div>
          {children}
          <p className="mt-6 text-sm text-stone-500 text-center">
            {mode === 'login' ? (
              <>
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="text-honey-600 font-medium hover:underline">
                  {t('auth.register')}
                </Link>
              </>
            ) : (
              <>
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className="text-honey-600 font-medium hover:underline">
                  {t('auth.login')}
                </Link>
              </>
            )}
          </p>
        </div>
        {mode === 'login' && (
          <p className="mt-4 text-center text-xs text-stone-400">{t('auth.demoHint')}</p>
        )}
      </div>
    </div>
  );
};

export const LoginPage = () => {
  const { t } = useTranslation();
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('auth.emailRequired'));
      return;
    }
    const result = await login(email, password);
    if (result.success) navigate('/');
    else setError(t('auth.loginError'));
  };

  return (
    <AuthLayout mode="login">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        <Input label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? t('common.loading') : t('auth.login')}
        </Button>
      </form>
    </AuthLayout>
  );
};

export const RegisterPage = () => {
  const { t } = useTranslation();
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return setError(t('auth.nameRequired'));
    if (!email) return setError(t('auth.emailRequired'));
    if (password.length < 6) return setError(t('auth.passwordShort'));
    if (password !== confirm) return setError(t('auth.passwordsDontMatch'));
    const result = await register(name, email, password);
    if (result.success) navigate('/');
    else setError(result.message || t('auth.loginError'));
  };

  return (
    <AuthLayout mode="register">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('auth.name')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.name')} />
        <Input label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        <Input label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <Input label={t('auth.confirmPassword')} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? t('common.loading') : t('auth.register')}
        </Button>
      </form>
    </AuthLayout>
  );
};
