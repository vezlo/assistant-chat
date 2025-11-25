import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Logo } from '@/components/ui/Logo';
import { getCurrentUser, loginUser } from '@/api';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, setWorkspace } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/config', { replace: true });
    }
  }, [isAuthenticated, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { access_token } = await loginUser({ email, password });
      const me = await getCurrentUser(access_token);

      login(access_token, {
        name: me.user.name,
        email: me.user.email,
        id: me.user.uuid,
        role: me.profile.role,
      });

      setWorkspace({
        name: me.profile.company_name || 'Workspace',
        plan: 'Community Edition',
      });

      navigate('/config', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white relative overflow-hidden">
      {/* Subtle geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>
      
      {/* E texture pattern - 3 horizontal dotted lines */}
      <div className="absolute inset-0 opacity-[0.10]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='10' y1='20' x2='70' y2='20' stroke='%23000000' stroke-width='1.5' stroke-dasharray='3,6'/%3E%3Cline x1='10' y1='40' x2='70' y2='40' stroke='%23000000' stroke-width='1.5' stroke-dasharray='3,6'/%3E%3Cline x1='10' y1='60' x2='70' y2='60' stroke='%23000000' stroke-width='1.5' stroke-dasharray='3,6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat'
      }}></div>
      <div className="max-w-md w-full relative z-10">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600 mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="admin@vezlo.org"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

