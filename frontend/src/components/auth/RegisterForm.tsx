import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, UserPlus, RefreshCw, ShieldCheck } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register, error, clearError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanFullName) {
      setValidationError('Full name is required.');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setValidationError('A valid email address is required.');
      return;
    }

    if (!password || password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: cleanFullName,
        username: cleanUsername,
        email: cleanEmail,
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
          Create Account
        </h2>
        <p className="text-xs text-slate-600">
          Register to participate in software development lifecycle projects.
        </p>
      </div>

      <div className="rounded border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-medium">Assigned Role: Developer / Student</span>
          <p className="text-[11px] text-blue-800 mt-0.5">
            Public accounts default to standard developer access. Privileged roles require team lead invitation.
          </p>
        </div>
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
            htmlFor="register-fullname"
            className="block text-xs font-medium text-slate-700"
          >
            Full Name
          </label>
          <input
            id="register-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
            placeholder="Jane Developer"
            autoComplete="name"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="register-username"
            className="block text-xs font-medium text-slate-700"
          >
            Username
          </label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            placeholder="janedev"
            autoComplete="username"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="register-email"
            className="block text-xs font-medium text-slate-700"
          >
            Email Address
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            placeholder="jane@example.com"
            autoComplete="email"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="register-password"
            className="block text-xs font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
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
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      <div className="border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-slate-900 underline hover:text-slate-700 transition-colors"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
