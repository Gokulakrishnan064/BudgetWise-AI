import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Wallet, Brain, MessageCircle, Calendar } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-primary-950">
      {/* Left side: Premium graphics/pitch (Visible only on lg and up) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-gradient-to-br from-secondary-900 via-secondary-950 to-primary-950 relative overflow-hidden flex-col justify-between p-12 text-white border-r border-white/5">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />

        {/* Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">BudgetWise</h1>
            <p className="text-[10px] text-secondary-400">AI Finance Manager</p>
          </div>
        </div>

        {/* Content Middle */}
        <div className="space-y-8 relative z-10 my-auto">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Take control of your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">wealth</span> with AI.
            </h2>
            <p className="text-secondary-400 text-sm leading-relaxed max-w-sm">
              BudgetWise AI analyzes your spending patterns, predicts future expenses, plans active budgets, and guides you toward financial freedom.
            </p>
          </div>

          {/* Bullets */}
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Predictive AI Insights</h4>
                <p className="text-xs text-secondary-400 mt-0.5">Know if you'll exceed your budget before the month ends.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Stateful Financial Assistant</h4>
                <p className="text-xs text-secondary-400 mt-0.5">Ask questions about saving targets and log transactions via chat.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Recurring Bills Calendar</h4>
                <p className="text-xs text-secondary-400 mt-0.5">Schedule payments, set active reminders, and mark bills paid.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-secondary-500">
          © 2026 BudgetWise AI. All rights reserved.
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="col-span-1 lg:col-span-7 xl:col-span-7 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="glass-card w-full animate-fade-in shadow-2xl shadow-primary-500/5 border-secondary-200/50 dark:border-secondary-800/40 p-8 rounded-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4 shadow-lg shadow-primary-500/25">
                <LogIn className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Welcome Back</h1>
              <p className="text-secondary-600 dark:text-secondary-400">Sign in to your BudgetWise AI account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl text-error-700 dark:text-error-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="input-label">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12 pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-secondary-600 dark:text-secondary-400">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
