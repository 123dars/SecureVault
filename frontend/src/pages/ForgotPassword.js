import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ShieldCheck, Loader2, Eye, EyeOff, ArrowLeft, Mail, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const TOAST_STYLE = { style: { background: '#1e293b', color: '#fff' } };

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
    { label: 'Very weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-lime-500' },
    { label: 'Very strong', color: 'bg-emerald-500' },
  ];

  if (!password) return null;
  const score = getStrength(password);
  const level = levels[score] || levels[0];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? level.color : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      {level.label && (
        <p className="text-xs text-slate-500">{level.label}</p>
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
      toast.error(err.response?.data?.error || 'No account found with this email.', TOAST_STYLE);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.', TOAST_STYLE);
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.', TOAST_STYLE);
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', { email, new_password: newPassword });
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.', TOAST_STYLE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative font-sans selection:bg-emerald-500/30 bg-[#0B0F19] overflow-hidden">

      {/* Full Screen Matrix Background — same as Login */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19]/95 via-[#0B0F19]/80 to-emerald-950/60 pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-7xl mx-auto">

        {/* LEFT SIDE — identical branding to Login */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12">
          <div className="relative w-full max-w-md aspect-square rounded-3xl flex items-center justify-center mb-10">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] rounded-full" />
            <img
              src="https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=2000&auto=format&fit=crop"
              alt="Encrypted Vault"
              className="relative z-10 w-full h-full object-cover rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/80"
            />
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-900/50">
                <ShieldCheck size={28} className="text-[#0B0F19]" strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">SecureVault</h1>
            </div>
            <p className="text-slate-400 text-lg font-medium max-w-sm mx-auto">
              Military-grade local encryption for your digital identity.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE — form card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#111827]/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black transition-all duration-500">

            {/* ── STEP 1: Verify Email ── */}
            {step === 1 && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-8"
                >
                  <ArrowLeft size={16} /> Return to Login
                </Link>

                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                  <p className="text-slate-400 text-sm">
                    Enter your account email and we'll verify it before allowing a reset.
                  </p>
                </div>

                <form onSubmit={handleVerifyEmail} className="space-y-5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="text-slate-500" size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-[#0B0F19]/50 text-white placeholder-slate-600"
                      placeholder="account@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-500 transition-all disabled:opacity-70 mt-2 shadow-lg shadow-emerald-900/20"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Email'}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500 font-medium pt-6 border-t border-slate-700/50">
                  Remembered it?{' '}
                  <Link to="/login" className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors">
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
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-8"
                >
                  <ArrowLeft size={16} /> Use different email
                </button>

                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-white mb-2">New Password</h2>
                  <p className="text-slate-400 text-sm">
                    Creating a new master password for{' '}
                    <span className="text-emerald-400 font-semibold">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="text-slate-500" size={18} />
                      </div>
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoFocus
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-[#0B0F19]/50 text-white font-mono placeholder-slate-600"
                        placeholder="New Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex="-1"
                      >
                        {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <StrengthBar password={newPassword} />
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="text-slate-500" size={18} />
                    </div>
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-[#0B0F19]/50 text-white font-mono placeholder-slate-600"
                      placeholder="Confirm Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex="-1"
                    >
                      {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {confirmPassword.length > 0 && (
                    <p className={`text-xs ${newPassword === confirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-500 transition-all disabled:opacity-70 mt-2 shadow-lg shadow-emerald-900/20"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 3: Success ── */}
            {step === 3 && (
              <div className="animate-in fade-in zoom-in-95 duration-300 text-center py-4">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Password Updated</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Your master password has been changed successfully.
                  Your vault remains encrypted and intact.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
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