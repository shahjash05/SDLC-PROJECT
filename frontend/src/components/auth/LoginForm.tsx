import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, LogIn, RefreshCw } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setValidationError('Username or email is required.');
      return;
    }

    if (!password) {
      setValidationError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        usernameOrEmail: cleanIdentifier,
        password,
      });
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = validationError ?? error;

  return (
    <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 max-w-md w-full shadow-none space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
          Sign In
        </h2>
        <p className="text-xs text-slate-600">
          Enter your credentials to access your SDLC workspace.
        </p>
      </div>

      {displayedError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{displayedError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="login-identifier"
            className="block text-xs font-medium text-slate-700"
          >
            Username or Email
          </label>
          <input
            id="login-identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={isSubmitting}
            placeholder="developer or dev@example.com"
            autoComplete="username"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-600">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-slate-900 underline hover:text-slate-700 transition-colors"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}
