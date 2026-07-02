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
        toast.success("Welcome back!", { icon: '👋' });
        navigate('/vault');
      }
    } catch (err) {
      console.error("Login error:", err);
      if (showMfaInput) setMfaCode(''); 
      toast.error(err.response?.data?.error || "Invalid credentials");
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

      {/* Main Content Layout */}
      <div className="relative z-10 flex w-full max-w-7xl mx-auto">
        
        {/* LEFT SIDE: Image & Branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="relative w-full max-w-md aspect-square rounded-[2.5rem] flex items-center justify-center mb-10 group">
            {/* Glowing orb effect behind image */}
            <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/30 blur-[80px] rounded-full group-hover:bg-indigo-500/40 transition-all duration-700"></div>
            {/* High-end Abstract Cyber Image */}
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

        {/* RIGHT SIDE: The Form Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700">
            
            {!showMfaInput ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome Back</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Decrypt your zero-knowledge vault</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <User className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    </div>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      required 
                      className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
                      placeholder="Username"
                    />
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="w-full pl-14 pr-14 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-indigo-600 dark:text-indigo-400 font-mono tracking-wider placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
                      placeholder="Master Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-4.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-[#18181b] p-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-800"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="flex justify-end mt-2 px-1">
                    <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-70 mt-6 shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="animate-spin" size={22} /> : 'Decrypt & Login'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <button 
                  onClick={() => { setShowMfaInput(false); setMfaCode(''); }}
                  className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 flex items-center gap-2 text-sm font-bold transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <ArrowLeft size={16} /> Cancel
                </button>

                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Smartphone size={32} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Two-Factor Auth</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Enter the 6-digit code from your authenticator device.</p>
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
                      className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-50 dark:bg-[#09090b] text-indigo-600 dark:text-indigo-400 placeholder-slate-300 dark:placeholder-slate-700 text-center text-4xl tracking-[0.5em] font-mono shadow-inner"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || mfaCode.length !== 6} 
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-70 shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="animate-spin" size={22} /> : 'Verify Identity'}
                  </button>
                </form>
              </div>
            )}
            
            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium pt-6 border-t border-slate-200 dark:border-slate-800">
              Don't have an account? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Register here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
