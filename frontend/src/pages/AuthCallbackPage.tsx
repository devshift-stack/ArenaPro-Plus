// OAuth Callback Handler
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      switch (error) {
        case 'google_not_configured':
        case 'github_not_configured':
          setErrorMessage('OAuth ist nicht konfiguriert. Bitte kontaktiere den Administrator.');
          break;
        case 'google_auth_failed':
        case 'github_auth_failed':
          setErrorMessage('Authentifizierung fehlgeschlagen. Bitte versuche es erneut.');
          break;
        case 'google_no_email':
        case 'github_no_email':
          setErrorMessage('E-Mail-Adresse konnte nicht abgerufen werden.');
          break;
        default:
          setErrorMessage('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token && refreshToken) {
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      setStatus('success');

      // Redirect to dashboard
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      setStatus('error');
      setErrorMessage('Keine Authentifizierungs-Tokens erhalten.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Anmeldung wird verarbeitet...</h2>
            <p className="text-slate-400">Bitte warten</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Erfolgreich angemeldet!</h2>
            <p className="text-slate-400">Du wirst weitergeleitet...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Anmeldung fehlgeschlagen</h2>
            <p className="text-slate-400">{errorMessage}</p>
            <p className="text-slate-500 text-sm mt-2">Du wirst zur Anmeldeseite weitergeleitet...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallbackPage;
