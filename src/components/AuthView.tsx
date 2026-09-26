import React, { useState } from 'react';
import { 
  Target, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Timer, 
  ArrowRight, 
  AlertCircle,
  Code2,
  GraduationCap,
  Briefcase,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthView: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, continueAsGuest, error, clearError } = useAuth();
  
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Developer');
  const [formLoading, setFormLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setResetSuccessMessage(null);
    clearError();

    if (authMode === 'forgot') {
      if (!email.trim()) {
        setLocalError('Please enter your email address to receive reset instructions.');
        return;
      }
      setFormLoading(true);
      try {
        await sendPasswordReset(email.trim());
        setResetSuccessMessage(`Password reset link sent to ${email.trim()}! Please check your inbox.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send password reset email';
        setLocalError(msg);
      } finally {
        setFormLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setFormLoading(true);
    try {
      if (authMode === 'signup') {
        if (!displayName.trim()) {
          setLocalError('Please provide your name.');
          setFormLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName.trim(), role);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setLocalError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setFormLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setLocalError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 md:p-6 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/15 via-emerald-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Value Proposition Column */}
        <div className="md:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for High Performers & Continuous Learners</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-indigo-500 to-amber-500 p-0.5 shadow-xl shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                CarinaTask<span className="text-emerald-400 font-light ml-1">Plus</span>
              </h1>
            </div>
            <p className="text-lg text-slate-300 font-normal leading-relaxed">
              Your command center for daily goals, unstoppable habit streaks, and laser-sharp focus sessions.
            </p>
          </div>

          {/* Highlights feature list */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Categorized Daily Goals</h4>
                <p className="text-xs text-slate-400 mt-0.5">Organize study, engineering tasks, health habits, and personal objectives with priority levels.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Habit Streak Matrix</h4>
                <p className="text-xs text-slate-400 mt-0.5">GitHub-style heatmaps and automatic consecutive streak calculations to keep you relentless.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Deep Focus & Daily Wrap-Up</h4>
                <p className="text-xs text-slate-400 mt-0.5">Integrated Pomodoro timer with audio chimes and end-of-day structured journaling.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="md:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            
            {/* Tab switch */}
            {authMode !== 'forgot' ? (
              <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl mb-6 border border-slate-800/60">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setLocalError(null); setResetSuccessMessage(null); }}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    authMode === 'signin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setLocalError(null); setResetSuccessMessage(null); }}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    authMode === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Reset Password</h2>
                  <p className="text-xs text-slate-400">We'll email you a secure link to reset it.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setLocalError(null); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}

            {/* Success banner */}
            {resetSuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-snug">{resetSuccessMessage}</span>
              </div>
            )}

            {/* Error banner */}
            {(localError || error) && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-snug">{localError || error}</span>
              </div>
            )}

            {authMode !== 'forgot' && (
              <>
                {/* Google Quick Sign-In */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={formLoading}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all duration-150 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">Or with email</span>
                  </div>
                </div>
              </>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Primary Track</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: 'Developer', icon: Code2 },
                        { label: 'Student', icon: GraduationCap },
                        { label: 'Professional', icon: Briefcase },
                        { label: 'Health & Fitness', icon: Activity },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setRole(item.label)}
                          className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                            role === item.label
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-medium truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">Password</label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgot'); setLocalError(null); setResetSuccessMessage(null); }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-150 shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
              >
                {formLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>
                      {authMode === 'signup' 
                        ? 'Create My Account' 
                        : authMode === 'forgot'
                        ? 'Send Password Reset Email'
                        : 'Sign In to Workspace'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Guest exploration link */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={continueAsGuest}
                className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors"
              >
                Just exploring? <span className="underline">Continue in Guest Sandbox Mode →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
