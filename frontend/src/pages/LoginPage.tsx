import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'github' | null>(null);

  const { login, loginWithGoogle, loginWithGithub } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsOAuthLoading('google');
    try {
      await loginWithGoogle();
    } catch (err) {
      toast.error('Google-Anmeldung fehlgeschlagen', 'Bitte versuche es erneut.');
      setIsOAuthLoading(null);
    }
  };

  const handleGithubLogin = async () => {
    setIsOAuthLoading('github');
    try {
      await loginWithGithub();
    } catch (err) {
      toast.error('GitHub-Anmeldung fehlgeschlagen', 'Bitte versuche es erneut.');
      setIsOAuthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Willkommen zurück!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Login fehlgeschlagen', 'Bitte prüfe deine Anmeldedaten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">AI Arena</h1>
          <p className="mt-2 text-slate-400">Willkommen zurück!</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                Angemeldet bleiben
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-cyan-400 hover:underline"
              >
                Passwort vergessen?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Anmelden
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-sm text-slate-500">oder</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={handleGithubLogin}
              disabled={isOAuthLoading !== null}
              isLoading={isOAuthLoading === 'github'}
            >
              {isOAuthLoading !== 'github' && <Github className="h-4 w-4" />}
              Mit GitHub anmelden
            </Button>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isOAuthLoading !== null}
              isLoading={isOAuthLoading === 'google'}
            >
              {isOAuthLoading !== 'google' && (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Mit Google anmelden
            </Button>
          </div>
        </div>

        {/* Register Link */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
