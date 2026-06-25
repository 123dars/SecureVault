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
  if (s <= 1) return { label: 'Weak',   segs: 1, color: 'bg-rose-500',    text: 'text-rose-400'    };
  if (s === 2) return { label: 'Fair',  segs: 2, color: 'bg-amber-400',   text: 'text-amber-400'   };
  if (s === 3) return { label: 'Good',  segs: 3, color: 'bg-emerald-400', text: 'text-emerald-400' };
  return               { label: 'Strong',segs: 4, color: 'bg-emerald-400', text: 'text-emerald-400' };
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
      toast.success('Vault initialized! Please log in to continue.', {
        style: { background: '#1e293b', color: '#fff' },
      });
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed', {
        style: { background: '#1e293b', color: '#fff' },
      });
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length > 0 ? getMasterStrength(password) : null;

  return (
    <div className="min-h-screen flex relative font-sans selection:bg-emerald-500/30 bg-[#0B0F19] overflow-hidden">

      {/* Matrix background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19]/95 via-[#0B0F19]/80 to-emerald-950/60 pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-7xl mx-auto">

        {/* ── LEFT: Branding ── */}
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

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
              {['AES-256 encrypted', 'Zero-knowledge', 'Stored locally'].map(label => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50"
                >
                  <ShieldCheck size={10} /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#111827]/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black animate-in fade-in zoom-in-95 duration-300">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <ShieldCheck size={20} className="text-[#0B0F19]" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">SecureVault</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
              <p className="text-slate-400 text-sm">Set up your zero-knowledge vault</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">

              {/* Username */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-slate-500" size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Username"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-[#0B0F19]/50 text-white placeholder-slate-600"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-slate-500" size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-[#0B0F19]/50 text-white placeholder-slate-600"
                />
              </div>

              {/* Password + live strength meter */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-slate-500" size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Master Password"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-[#0B0F19]/50 text-white font-mono placeholder-slate-600 placeholder:font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex="-1"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Strength meter — appears as user types */}
                {strength && (
                  <div className="mt-2.5 px-1">
                    <div className="flex gap-1 mb-1.5">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.segs ? strength.color : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Master password strength:{' '}
                      <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-70 mt-2 shadow-lg shadow-emerald-900/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Vault'}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-8 text-center text-sm text-slate-500 font-medium pt-6 border-t border-slate-700/50">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}