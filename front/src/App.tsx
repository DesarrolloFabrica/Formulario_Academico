import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { getMe, loginWithGoogle, tokenStore } from './services/api';
import type { User } from './types/evaluation';
import { AdminPage } from './pages/AdminPage';
import { FormPage } from './pages/FormPage';
import { LoginPage } from './pages/LoginPage';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'form' | 'admin'>('form');
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tokenStore.get()) return;
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (credential: string) => {
    setError('');
    try {
      const session = await loginWithGoogle(credential);
      setUser(session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesion');
    }
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    setView('form');
  };

  if (!googleClientId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h1 className="text-xl font-bold">Falta configurar Google OAuth</h1>
          <p className="mt-2">Define VITE_GOOGLE_CLIENT_ID en front/.env para habilitar el inicio de sesion.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 font-semibold text-slate-600">Preparando sesion...</main>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {!user ? (
        <LoginPage onLogin={handleLogin} error={error} />
      ) : view === 'admin' && user.role === 'admin' ? (
        <AdminPage onBack={() => setView('form')} />
      ) : (
        <FormPage user={user} onLogout={logout} onAdmin={() => setView('admin')} />
      )}
    </GoogleOAuthProvider>
  );
}
