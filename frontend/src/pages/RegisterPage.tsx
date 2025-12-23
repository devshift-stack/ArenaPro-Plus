import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    if (!password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen haben';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      await register(email, password, name);
      toast.success('Willkommen bei AI Arena!', 'Dein Konto wurde erstellt.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Registrierung fehlgeschlagen', 'Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Konto erstellen</h1>
          <p className="mt-2 text-slate-400">
            Starte deine Reise mit AI Arena
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mindestens 8 Zeichen"
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
                error={errors.password}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-400">
                Ich akzeptiere die{' '}
                <Link to="/terms" className="text-cyan-400 hover:underline">
                  Nutzungsbedingungen
                </Link>{' '}
                und{' '}
                <Link to="/privacy" className="text-cyan-400 hover:underline">
                  Datenschutzrichtlinie
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Konto erstellen
            </Button>
          </form>
        </div>

        {/* Login Link */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Jetzt anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
