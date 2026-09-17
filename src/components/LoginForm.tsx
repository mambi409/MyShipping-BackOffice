import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { AuthSession } from '../types';

interface LoginFormProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setError('Please enter your authorized username.');
      return;
    }
    if (!trimmedPass) {
      setError('Please enter your security password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Allow 'admin' / 'password123', 'officer' / 'secure2026', or any username with pass >= 6 chars
      if (
        (trimmedUser.toLowerCase() === 'admin' && trimmedPass === 'password123') ||
        (trimmedUser.toLowerCase() === 'officer' && trimmedPass === 'secure2026') ||
        (trimmedPass.length >= 6)
      ) {
        const session: AuthSession = {
          isAuthenticated: true,
          username: trimmedUser,
          role: trimmedUser.toLowerCase() === 'admin' ? 'Administrator' : 'Logistics Officer',
          loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        onLoginSuccess(session);
      } else {
        setError('Invalid credentials. Password must be at least 6 characters (or use demo: admin / password123).');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    setUsername('admin');
    setPassword('password123');
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        isAuthenticated: true,
        username: 'admin',
        role: 'Administrator',
        loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }, 300);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" id="login-container">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-8 sm:p-10" id="login-card">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-4 ring-8 ring-indigo-50/60" id="login-shield-icon">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" id="login-title">
            Restricted Logistics Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs" id="login-subtitle">
            Please authenticate to access the parcel dispatch entry form and manifest registry.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-2.5"
            role="alert"
            id="login-error-alert"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="login-username-input">
              Username or Operator ID
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or logistics_lead"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="login-password-input">
                Password
              </label>
              <span className="text-xs text-slate-500 font-medium">Demo: password123</span>
            </div>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                id="toggle-password-visibility-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-70 shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Protected Area</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials helper */}
        <div className="mt-8 pt-6 border-t border-slate-100" id="login-demo-helper">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Quick Credentials
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-mono">
              admin / password123
            </span>
          </div>

          <button
            type="button"
            id="quick-fill-login-btn"
            onClick={handleQuickDemoLogin}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Fill Demo Credentials & Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
