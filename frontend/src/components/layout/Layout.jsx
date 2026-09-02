import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Warehouse, Hexagon, Search, ClipboardList, Calendar,
  Crown, Droplets, Wallet, BarChart3, Settings, LogOut, X, Menu, Bell,
  Check, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { NotificationBell } from '../common/NotificationBell';
import { Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/apiaries', icon: Warehouse, key: 'apiaries' },
  { to: '/hives', icon: Hexagon, key: 'hives' },
  { to: '/inspections', icon: Search, key: 'inspections' },
  { to: '/tasks', icon: ClipboardList, key: 'tasks' },
  { to: '/calendar', icon: Calendar, key: 'calendar' },
  { to: '/queens', icon: Crown, key: 'queens' },
  { to: '/harvests', icon: Droplets, key: 'harvests' },
  { to: '/finances', icon: Wallet, key: 'finances' },
  { to: '/statistics', icon: BarChart3, key: 'statistics' },
  { to: '/settings', icon: Settings, key: 'settings' },
];

const MOBILE_NAV = [
  { to: '/', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/hives', icon: Hexagon, key: 'hives' },
  { to: '/tasks', icon: ClipboardList, key: 'tasks' },
  { to: '/calendar', icon: Calendar, key: 'calendar' },
  { to: '/notifications', icon: Bell, key: 'notifications' },
];

export const Layout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { workspaces, active, setActive } = useWorkspace();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Full-page forms (add / edit) : on mobile the bottom tab bar is hidden so it
  // never covers the Save / Cancel buttons.
  const isFormPage = /\/(new|edit)$/.test(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const WorkspaceSwitcher = () => (
    <div className="relative">
      <button
        onClick={() => setWsOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-honey-50 hover:bg-honey-100 text-honey-700 text-sm font-semibold transition dark:bg-honey-900/30 dark:hover:bg-honey-900/50 dark:text-honey-300"
      >
        <span className="truncate">{active?.name || t('workspace.select')}</span>
        <span className="ms-auto text-[10px] font-mono text-honey-500">▾</span>
      </button>
      {wsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setWsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 rounded-xl bg-white border border-stone-200 shadow-lg z-50 py-1 dark:bg-stone-800 dark:border-stone-700">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => { setActive(w.id); setWsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-honey-50 dark:text-stone-200 dark:hover:bg-honey-900/30"
              >
                <span className="truncate">{w.name}</span>
                {w.id === active?.id && <Check className="h-4 w-4 text-honey-600 ms-auto dark:text-honey-400" />}
              </button>
            ))}
            <div className="border-t border-stone-100 mt-1 pt-1 dark:border-stone-700">
              <Link to="/workspace" onClick={() => setWsOpen(false)} className="block px-3 py-2 text-sm text-honey-600 hover:bg-honey-50 dark:text-honey-400 dark:hover:bg-honey-900/30">
                {t('workspace.manage')}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const navLinkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-300'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
    }`;

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-100 dark:border-stone-800">
        <div className="h-10 w-10 rounded-xl bg-honey-500 flex items-center justify-center text-white text-xl">🐝</div>
        <div>
          <p className="font-bold text-stone-800 leading-tight dark:text-stone-100">{t('appName')}</p>
          <p className="text-xs text-stone-400">{t('tagline')}</p>
        </div>
        <button className="ms-auto lg:hidden text-stone-500 dark:text-stone-400" onClick={() => setSidebarOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkCls} onClick={() => setSidebarOpen(false)}>
            <item.icon className="h-5 w-5 shrink-0" />
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-stone-100 space-y-3 dark:border-stone-800">
        <WorkspaceSwitcher />
        <LanguageSwitcher />
        <div className="flex items-center gap-3 mt-4">
          <div className="h-9 w-9 rounded-full bg-honey-200 flex items-center justify-center font-bold text-honey-700 dark:bg-honey-900/40 dark:text-honey-300">
            {(user?.name || 'A')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate dark:text-stone-100">{user?.name}</p>
            <p className="text-xs text-stone-400 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30 dark:hover:text-red-400">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-stone-950">
      <aside className="hidden lg:flex w-64 bg-white border-e border-stone-100 fixed inset-y-0 start-0 z-40 dark:bg-stone-900 dark:border-stone-800">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-white shadow-xl z-10 dark:bg-stone-900">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 lg:ms-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-stone-100 px-4 py-3 flex items-center justify-between lg:hidden dark:bg-stone-900/80 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg dark:text-stone-300 dark:hover:bg-stone-800">
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="font-bold text-stone-800 flex items-center gap-2 dark:text-stone-100">
              <span className="text-xl">🐝</span> {t('appName')}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        <header className="hidden lg:flex sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-stone-100 px-6 py-3 items-center justify-between dark:bg-stone-900/80 dark:border-stone-800">
          <div className="w-56"><WorkspaceSwitcher /></div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        <main className={`flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto ${
          isFormPage
            ? 'max-lg:pb-[env(safe-area-inset-bottom)]'
            : 'max-lg:pb-[calc(6rem_+_env(safe-area-inset-bottom))]'
        }`}>
          <Outlet />
        </main>

        <nav className={`${isFormPage ? 'hidden' : 'lg:hidden'} fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 flex justify-around py-2 pb-[env(safe-area-inset-bottom)] dark:bg-stone-900 dark:border-stone-800`}>
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium ${
                  isActive ? 'text-honey-600 dark:text-honey-400' : 'text-stone-400 dark:text-stone-500'
                }`
              }
            >
              <item.icon className="h-5 w-5 mb-0.5" />
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
