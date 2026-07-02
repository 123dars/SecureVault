import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

function getMasterStrength(pw) {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw))   s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  
  if (s <= 1) return { label: 'Weak',   segs: 1, color: 'bg-rose-500',   text: 'text-rose-600 dark:text-rose-500'  };
  if (s === 2) return { label: 'Fair',  segs: 2, color: 'bg-amber-500',  text: 'text-amber-600 dark:text-amber-500' };
  if (s === 3) return { label: 'Good',  segs: 3, color: 'bg-indigo-400', text: 'text-indigo-500 dark:text-indigo-400' };
  return               { label: 'Strong',segs: 4, color: 'bg-indigo-600', text: 'text-indigo-700 dark:text-indigo-400' };
}

export default function Register() {
  const [username, setUsername]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { username, email, password });
      toast.success('Vault initialized! Please log in to continue.', { icon: '🎉' });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length > 0 ? getMasterStrength(password) : null;

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

        {/* ── LEFT: Branding ── */}
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

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
              {['AES-256 encrypted', 'Zero-knowledge', 'Stored locally'].map(label => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-[#18181b] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 shadow-sm"
                >
                  <ShieldCheck size={12} className="text-indigo-500" /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg border border-indigo-400/20">
                <ShieldCheck size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">SecureVault</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Create Account</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Set up your zero-knowledge vault</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">

              {/* Username */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Username"
                  className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email Address"
                  className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
                />
              </div>

              {/* Password + live strength meter */}
              <div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Master Password"
                    className="w-full pl-14 pr-14 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-indigo-600 dark:text-indigo-400 font-mono tracking-wider placeholder-slate-400 dark:placeholder-slate-500 placeholder:font-sans shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex="-1"
                    className="absolute right-5 top-4.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-[#18181b] p-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-800"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength meter — appears as user types */}
                {strength && (
                  <div className="mt-3 px-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex gap-1.5 mb-2">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.segs ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Password strength:{' '}
                      <span className={`font-extrabold ${strength.text}`}>{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-70 mt-4 shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : 'Create Vault'}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium pt-6 border-t border-slate-200 dark:border-slate-800">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
