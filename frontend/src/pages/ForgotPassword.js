import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ShieldCheck, Loader2, Eye, EyeOff, ArrowLeft, Mail, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

function StrengthBar({ password }) {
  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const levels = [
    { label: '', color: '' },
    { label: 'Very weak', color: 'bg-rose-500' },
    { label: 'Weak', color: 'bg-amber-500' },
    { label: 'Fair', color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-indigo-400' },
    { label: 'Very strong', color: 'bg-indigo-600' },
  ];

  if (!password) return null;
  const score = getStrength(password);
  const level = levels[score] || levels[0];

  return (
    <div className="mt-3 space-y-1 px-1 animate-in fade-in">
      <div className="flex gap-1.5 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? level.color : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      {level.label && (
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Strength: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold uppercase text-[10px] tracking-widest ml-1">{level.label}</span>
        </p>
      )}
    </div>
  );
}

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: new password, 3: success
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Step 1: Verify email exists
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/verify', { email });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No account found with this email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', { email, new_password: newPassword });
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative font-sans selection:bg-indigo-500/30 bg-slate-50 dark:bg-[#09090b] overflow-hidden">

      {/* Full Screen Matrix Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.03] dark:opacity-[0.05] mix-blend-luminosity pointer-events-none z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }}
      />
      {/* Dynamic Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#09090b]/95 via-[#09090b]/90 to-indigo-950/20 pointer-events-none z-0 hidden dark:block" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-white/80 to-indigo-50/50 pointer-events-none z-0 dark:hidden" />

      <div className="relative z-10 flex w-full max-w-7xl mx-auto">

        {/* LEFT SIDE — branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="relative w-full max-w-md aspect-square rounded-[2.5rem] flex items-center justify-center mb-10 group">
            <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/30 blur-[80px] rounded-full group-hover:bg-indigo-500/40 transition-all duration-700" />
            <img
              src="https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=2000&auto=format&fit=crop"
              alt="Encrypted Vault"
              className="relative z-10 w-full h-full object-cover rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-indigo-900/20"
            />
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/30 border border-indigo-400/20">
                <ShieldCheck size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
              <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">SecureVault</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-sm mx-auto">
              Military-grade local encryption for your digital identity.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE — form card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg border border-indigo-400/20">
                <ShieldCheck size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">SecureVault</span>
            </div>

            {/* ── STEP 1: Verify Email ── */}
            {step === 1 && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-bold mb-8 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <ArrowLeft size={16} /> Return to Login
                </Link>

                <div className="text-center mb-10">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Reset Password</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Enter your account email and we'll verify it before allowing a reset.
                  </p>
                </div>

                <form onSubmit={handleVerifyEmail} className="space-y-5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Mail className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
                      placeholder="account@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-70 mt-6 shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="animate-spin" size={22} /> : 'Verify Email'}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium pt-6 border-t border-slate-200 dark:border-slate-800">
                  Remembered it?{' '}
                  <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                    Back to login
                  </Link>
                </div>
              </div>
            )}

            {/* ── STEP 2: Set New Password ── */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-bold mb-8 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <ArrowLeft size={16} /> Use different email
                </button>

                <div className="text-center mb-10">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">New Password</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Creating a new master password for <br/>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <KeyRound className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      </div>
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoFocus
                        className="w-full pl-14 pr-14 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white font-mono tracking-wider placeholder-slate-400 dark:placeholder-slate-500 placeholder:font-sans shadow-inner"
                        placeholder="New Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                        tabIndex="-1"
                      >
                        {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <StrengthBar password={newPassword} />
                  </div>

                  {/* Confirm Password */}
                  <div className="relative group pt-2">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none pt-2">
                      <Lock className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    </div>
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-14 pr-14 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white font-mono tracking-wider placeholder-slate-400 dark:placeholder-slate-500 placeholder:font-sans shadow-inner"
                      placeholder="Confirm Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      tabIndex="-1"
                    >
                      {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {confirmPassword.length > 0 && (
                    <p className={`text-xs font-bold px-2 ${newPassword === confirmPassword ? 'text-indigo-500' : 'text-rose-500'}`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-70 mt-6 shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="animate-spin" size={22} /> : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 3: Success ── */}
            {step === 3 && (
              <div className="animate-in fade-in zoom-in-95 duration-300 text-center py-4">
                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-indigo-500/10">
                  <CheckCircle2 size={48} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Password Updated</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-xs mx-auto">
                  Your master password has been changed successfully.
                  Your vault remains encrypted and intact.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
                >
                  Return to Login
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
