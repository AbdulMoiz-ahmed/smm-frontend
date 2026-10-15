import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, Sparkles, UserCheck, 
  ArrowRight, Palette, Crown, PenTool, Video, Share2, Briefcase, 
  KeyRound, AlertCircle, Check
} from 'lucide-react';

const AGENCY_ACCOUNT_PRESETS = [
  {
    role: 'admin',
    name: "Agency Director",
    email: 'admin@agency.com',
    badge: "Full Admin",
    badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    icon: Crown,
    scope: "Full system & brand contracts"
  },
  {
    role: 'designer',
    name: "Graphic Designer",
    email: 'designer@agency.com',
    badge: "Designer",
    badgeClass: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    icon: Palette,
    scope: "Today's deck & Posts calendar"
  },
  {
    role: 'copywriter',
    name: "Senior Copywriter",
    email: 'writer@agency.com',
    badge: "Copywriter",
    badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    icon: PenTool,
    scope: "Captions & copy drafts"
  },
  {
    role: 'video_editor',
    name: "Video Editor",
    email: 'video@agency.com',
    badge: "Video/Reels",
    badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    icon: Video,
    scope: "Reels & motion renders"
  },
  {
    role: 'smm',
    name: "Social Media Manager",
    email: 'smm@agency.com',
    badge: "Publisher",
    badgeClass: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    icon: Share2,
    scope: "Publishing queue & quotas"
  },
  {
    role: 'account_manager',
    name: "Account Manager",
    email: 'manager@agency.com',
    badge: "Client Lead",
    badgeClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    icon: Briefcase,
    scope: "Deliverables & brand targets"
  }
];

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const passwordInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }
    if (!password) {
      setError('Password is required. Please type your password to sign in.');
      passwordInputRef.current?.focus();
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clicking an account card ONLY selects the email and focuses the password field
  // NEVER bypasses password or logs in automatically!
  const handleSelectAccountPreset = (acc) => {
    setEmail(acc.email);
    setPassword('');
    setError('');
    setSelectedPreset(acc);
    // Focus the password input so the user types their password
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleClearSelection = () => {
    setEmail('');
    setPassword('');
    setSelectedPreset(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 shadow-xl shadow-orange-500/25 ring-1 ring-white/20 mb-2">
            <span className="text-white font-black text-2xl tracking-tight">CP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Agency Content Planner
          </h1>
          <p className="text-sm text-slate-400">
            Secure Multi-Role Team Login & Access Portal
          </p>
        </div>

        {/* Quick Email Selection Cards (Password Required) */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span className="flex items-center gap-1.5 text-orange-400">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Select Agency Email
            </span>
            <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-amber-400 font-bold flex items-center gap-1">
              <KeyRound className="w-3 h-3" />
              Password Always Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {AGENCY_ACCOUNT_PRESETS.map(acc => {
              const IconComp = acc.icon;
              const isSelected = email.toLowerCase() === acc.email.toLowerCase();

              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectAccountPreset(acc)}
                  className={`text-left p-2.5 rounded-xl border transition-all group active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 border-orange-500/70 ring-1 ring-orange-500/50 shadow-md'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 hover:border-slate-600'
                  }`}
                  title={`Select ${acc.name} email (Password required)`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`p-1 rounded-lg ${isSelected ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-300'}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${acc.badgeClass}`}>
                      {acc.badge}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-white truncate flex items-center justify-between">
                    <span>{acc.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-orange-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{acc.email}</div>
                  <div className="text-[9px] text-slate-400 mt-1 truncate">
                    {acc.scope}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Secure Login Form */}
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500" />
              <span>Enter Credentials to Sign In</span>
            </h2>
            {selectedPreset && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Account Selected Banner Notice */}
          {selectedPreset && (
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-between gap-3 text-xs text-orange-300">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping shrink-0"></span>
                <span className="truncate">
                  Signing in as <strong>{selectedPreset.name}</strong> ({selectedPreset.email})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">Type password below</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedPreset(null);
                  }}
                  placeholder="e.g. designer@agency.com"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Account Password <span className="text-orange-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500">Encrypted with Bcrypt</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  required
                  autoFocus={!!selectedPreset}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Agency Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Guarantee Micro-Badge */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Password Authentication Required • Zero Password Bypass</span>
          </div>
        </div>
      </div>
    </div>
  );
}
