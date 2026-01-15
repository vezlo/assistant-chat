import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Building2, User, BookOpen, LifeBuoy, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useApp } from '@/contexts/AppContext';
import { useIsAdmin } from '@/utils/useIsAdmin';

export function Header() {
  const navigate = useNavigate();
  const { user, workspace, activeSection, setActiveSection, logout } = useApp();
  const isAdmin = useIsAdmin();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const primaryNav = [
    { label: 'Chat Assistant', href: '/config', key: 'widget' },
    ...(isAdmin ? [{ label: 'Team', key: 'team', href: '/team' }] : []),
    ...(isAdmin ? [{ label: 'Integrations', key: 'integrations', href: '/integrations' }] : []),
    ...(isAdmin ? [{ label: 'API Keys', key: 'api-keys', href: '/api-keys' }] : []),
    ...(isAdmin ? [{ label: 'Settings', key: 'settings', href: '/settings' }] : []),
  ];

  // Update active section based on current route
  useEffect(() => {
    const currentNav = primaryNav.find((nav) => nav.href === location.pathname);
    if (currentNav) {
      setActiveSection(currentNav.key);
    } else {
      // Clear active section when on routes not in primaryNav (e.g., /account-settings)
      setActiveSection('');
    }
  }, [location.pathname, setActiveSection]);

  // Get breadcrumb label for current route
  const getBreadcrumbLabel = (): string | null => {
    const currentNav = primaryNav.find((nav) => nav.href === location.pathname);
    if (currentNav) {
      return currentNav.label;
    }
    // Handle routes not in primaryNav
    if (location.pathname === '/account-settings') {
      return 'Account Settings';
    }
    return null;
  };

  const breadcrumbLabel = getBreadcrumbLabel();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    if (!name || name.trim().length === 0) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'A';
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-8 space-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-[240px] relative" ref={workspaceMenuRef}>
            <Logo size="lg" className="max-h-20 -ml-3.5" />
            <div className="text-gray-300 text-lg font-light">/</div>
            <button
              onClick={() => setIsWorkspaceMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 leading-tight mt-0.5 px-3 py-1 rounded-lg border border-transparent hover:border-gray-200 transition-colors cursor-pointer bg-white"
              aria-label="Workspace menu"
            >
              <div
                className="w-[22px] h-[22px] rounded-full shadow"
                style={{ backgroundColor: '#FB7185' }}
              />
              <p className="text-[15px] font-semibold text-gray-900">
                {workspace?.name || 'Workspace'}
              </p>
              {!isWorkspaceMenuOpen ? (
                <svg
                  className="w-[14px] h-[14px] text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              ) : (
                <svg
                  className="w-[14px] h-[14px] text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 15l6-6 6 6" />
                </svg>
              )}
            </button>
            {isWorkspaceMenuOpen && (
              <div className="absolute top-[65px] left-[105px] w-64 rounded-xl border border-gray-100 bg-white shadow-2xl p-3 space-y-3 z-20">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-[20px] h-[20px] rounded-full shadow"
                      style={{ backgroundColor: '#FB7185' }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {workspace?.name.split(' · ')[0] || 'Workspace'}
                      </p>
                      <p className="text-xs text-gray-500">Workspace</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                    Community
                  </span>
                </div>
                <button className="w-full text-left text-sm text-gray-700 hover:bg-emerald-100 rounded-lg px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  Billing
                </button>
                <button className="w-full text-left text-sm text-gray-700 hover:bg-emerald-100 rounded-lg px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  Workspace Settings
                </button>
              </div>
            )}
            {breadcrumbLabel && (
              <>
                <div className="text-gray-300 text-lg font-light">/</div>
                <span className="text-[15px] font-semibold text-gray-900 leading-tight mt-0.5">
                  {breadcrumbLabel}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/50 shadow-sm"
              title="Community edition - Free and open source"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              {workspace?.plan || 'Community Edition'}
            </span>
            <a
              href="https://vezlo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Documentation"
            >
              <BookOpen className="w-5 h-5" />
            </a>
            <a
              href="https://vezlo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Support & Help"
            >
              <LifeBuoy className="w-5 h-5" />
            </a>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center rounded-full border border-gray-200 p-0.5 hover:border-gray-300 transition-colors bg-white cursor-pointer"
                aria-label="User menu"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold transition-transform hover:scale-[1.03] hover:brightness-110">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                  ) : (
                    getInitials(user?.name || 'A')
                  )}
                </div>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-60 rounded-xl border border-gray-100 bg-white shadow-2xl p-3 space-y-2 z-20">
                  <div className="border-b border-gray-100 pb-2">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'admin@vezlo.org'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/account-settings');
                    }}
                    className="w-full flex items-center gap-2 text-left text-sm text-gray-700 hover:bg-emerald-100 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    Account Settings
                  </button>
                <button
                  onClick={async () => {
                    if (isLoggingOut) return;
                    setIsLoggingOut(true);
                    try {
                      await logout();
                      navigate('/login');
                    } finally {
                      setIsLoggingOut(false);
                    }
                  }}
                  disabled={isLoggingOut}
                  className="w-full text-left text-sm text-red-600 hover:bg-red-50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-70 border-t border-gray-100 mt-1 pt-2"
                >
                  {isLoggingOut ? 'Logging out…' : 'Logout'}
                </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-0.5">
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-500 overflow-x-auto">
            {primaryNav.map((item) => {
              const isActive = activeSection === item.key;
              const className = `pb-1 border-b-2 transition-colors ${
                isActive
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={className}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

