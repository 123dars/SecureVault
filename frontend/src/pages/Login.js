import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck, Loader2, Eye, EyeOff, Smartphone, ArrowLeft, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = { username, password };
      if (showMfaInput) payload.totp_code = mfaCode;

      const res = await api.post('/auth/login', payload);
      
      if (res.status === 206 || res.data?.mfa_required) {
        setShowMfaInput(true);
      } else {
        login(password, res.data); 
        toast.success("Welcome back!", { style: { background: '#1e293b', color: '#fff' }});
        navigate('/vault');
      }
    } catch (err) {
      console.error("Login error:", err);
      if (showMfaInput) setMfaCode(''); 
      toast.error(err.response?.data?.error || "Invalid credentials", { style: { background: '#1e293b', color: '#fff' }});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative font-sans selection:bg-emerald-500/30 bg-[#0B0F19] overflow-hidden">
      
      {/* Full Screen Matrix Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }}
      ></div>
      {/* Dark Emerald Glass Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19]/95 via-[#0B0F19]/80 to-emerald-950/60 pointer-events-none"></div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex w-full max-w-7xl mx-auto">
        
        {/* LEFT SIDE: Image & Branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12">
          <div className="relative w-full max-w-md aspect-square rounded-3xl flex items-center justify-center mb-10">
            {/* Glowing orb effect behind image */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] rounded-full"></div>
            {/* High-end Abstract Cyber Image */}
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

        {/* RIGHT SIDE: The Form Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#111827]/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black transition-all duration-500">
            
            {!showMfaInput ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-slate-400 text-sm">Decrypt your zero-knowledge vault</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="text-slate-500" size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      required 
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-[#0B0F19]/50 text-white placeholder-slate-600"
                      placeholder="Username"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="text-slate-500" size={18} />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-[#0B0F19]/50 text-white font-mono placeholder-slate-600"
                      placeholder="Master Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="flex justify-end mt-2 px-1">
                    <Link to="/forgot-password" className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-500 transition-all disabled:opacity-70 mt-4 shadow-lg shadow-emerald-900/20"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <button 
                  onClick={() => { setShowMfaInput(false); setMfaCode(''); }}
                  className="text-slate-400 hover:text-white mb-8 flex items-center gap-2 text-sm font-semibold transition-colors"
                >
                  <ArrowLeft size={16} /> Cancel
                </button>

                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Smartphone size={32} className="text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Auth</h2>
                  <p className="text-slate-400 text-sm">Enter the 6-digit code from your authenticator device.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <input 
                      type="text" 
                      maxLength="6"
                      placeholder="000000" 
                      value={mfaCode} 
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} 
                      required 
                      autoFocus
                      className="w-full p-4 rounded-xl border border-slate-700/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all bg-[#0B0F19]/50 text-amber-400 placeholder-slate-700 text-center text-3xl tracking-[0.5em] font-mono"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || mfaCode.length !== 6} 
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3.5 rounded-xl font-bold hover:bg-amber-500 transition-all disabled:opacity-70 shadow-lg shadow-amber-900/20"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Identity'}
                  </button>
                </form>
              </div>
            )}
            
            <div className="mt-8 text-center text-sm text-slate-500 font-medium pt-6 border-t border-slate-700/50">
              Don't have an account? <Link to="/register" className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors">Register here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}