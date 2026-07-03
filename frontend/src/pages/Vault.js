import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import api from '../api';
import { encryptData, decryptData } from '../crypto';
import { runSecurityAudit } from '../utils/securityAudit';
import PasswordCard from '../components/PasswordCard';
import SkeletonCard from '../components/SkeletonCard';
import PasswordGenerator from '../components/PasswordGenerator';
import toast from 'react-hot-toast';
import {
  Search, Filter, ShieldCheck,
  LogOut, Wand2, ShieldAlert, Copy, Eye, EyeOff, ChevronDown,
  Moon, Sun, ShieldOff, Plus, Lock
} from 'lucide-react';

const CATEGORIES = ['General', 'Work', 'Finance', 'Social', 'Gaming', 'Shopping'];
const CATEGORY_COLORS = {
  General:  'bg-slate-400',
  Work:     'bg-blue-500',
  Finance:  'bg-emerald-500',
  Social:   'bg-indigo-500',
  Gaming:   'bg-rose-500',
  Shopping: 'bg-amber-500',
};

function PasswordCriteria({ criteria }) {
  const items = [
    { label: '8+ chars', met: criteria.length },
    { label: 'Uppercase', met: criteria.uppercase },
    { label: 'Lowercase', met: criteria.lowercase },
    { label: 'Number', met: criteria.number },
    { label: 'Symbol', met: criteria.special },
  ];
  const hasAnyInput = Object.values(criteria).some(Boolean);
  if (!hasAnyInput) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map(item => (
        <span
          key={item.label}
          className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full transition-colors ${
            item.met
              ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
              : 'bg-slate-100 dark:bg-[#18181b] text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function Vault() {
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const [passwords,       setPasswords]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterCategory,  setFilterCategory]  = useState('All');
  
  const [newForm,         setNewForm]         = useState({ site_name: '', username: '', password: '', category: 'General' });
  const [showGenerator,   setShowGenerator]   = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [sessionWarning,  setSessionWarning]  = useState(false);
  const [criteria,        setCriteria]        = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false,
  });
  const masterPassword = sessionStorage.getItem('masterPassword');

  const fetchPasswords = useCallback(async () => {
    try {
      const res = await api.get('/passwords');
      const decryptedVault = await Promise.all(res.data.map(async item => {
        let password = '';
        try {
          password = await decryptData(item.encrypted_password, item.iv, masterPassword);
        } catch (e) {
          password = 'ERROR_DECRYPTING';
        }
        return {
          ...item,
          password
        };
      }));
      setPasswords(decryptedVault);
    } catch (err) {
      console.error("Failed to fetch vault", err);
    } finally {
      setLoading(false);
    }
  }, [masterPassword]);

  useEffect(() => { fetchPasswords(); }, [fetchPasswords]);
  
  useEffect(() => {
    const warnTimer = setTimeout(() => setSessionWarning(true),  13 * 60 * 1000);
    const lockTimer = setTimeout(() => logout(),                 15 * 60 * 1000);
    return () => { clearTimeout(warnTimer); clearTimeout(lockTimer); };
  }, [logout]);

  const vaultHealth = useMemo(() => {
    if (passwords.length === 0) return { totalScore: 100, weakPasswords: [], reusedPasswords: [] };
    return runSecurityAudit(passwords);
  }, [passwords]);

  const scoreColor =
    vaultHealth.totalScore === 100 ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500' :
    vaultHealth.totalScore >= 70   ? 'text-amber-500 dark:text-amber-400 border-amber-500'     :
                                     'text-rose-500 dark:text-rose-400 border-rose-500';

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setNewForm({ ...newForm, password: val });
    setCriteria({
      length:    val.length >= 8,
      uppercase: /[A-Z]/.test(val),
      lowercase: /[a-z]/.test(val),
      number:    /[0-9]/.test(val),
      special:   /[^A-Za-z0-9]/.test(val),
    });
  };

  const handleCopyPassword = () => {
    if (!newForm.password) return;
    navigator.clipboard.writeText(newForm.password);
    toast.success("Password copied!", { icon: '📋' });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!masterPassword) {
      toast.error("Security session expired! Please click 'Lock Vault' and log in again.");
      return;
    }
    
    if (newForm.password.length === 0) {
      toast.error("Please enter a password or PIN!");
      return;
    }
    try {
      const pwdEncrypt = await encryptData(newForm.password, masterPassword);
      
      await api.post('/passwords', {
        site_name:             newForm.site_name,
        username:              newForm.username,
        encrypted_password:    pwdEncrypt.ciphertext,
        iv:                    pwdEncrypt.iv,
        category:              newForm.category,
      });
      
      setNewForm({ site_name: '', username: '', password: '', category: 'General' });
      setCriteria({ length: false, uppercase: false, lowercase: false, number: false, special: false });
      setShowGenerator(false);
      setShowPassword(false);
      fetchPasswords();
      toast.success("Credential securely encrypted & saved!", { icon: '🔐' });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save credential.");
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-900 dark:text-white">Delete this credential?</span>
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.delete(`/passwords/${id}`);
              setPasswords(prev => prev.filter(p => p.id !== id));
              toast.success("Credential destroyed!", { icon: '🗑️' });
            } catch {
              toast.error("Failed to delete credential.");
            }
          }}
          className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    ), { duration: 8000 });
  };

  const filteredPasswords = passwords.filter(p => {
    const matchesSearch   = p.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const scrollToForm = () => {
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] font-sans selection:bg-indigo-500/30 pb-20 relative animate-in fade-in duration-300">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-[0.03] dark:opacity-[0.05] mix-blend-luminosity pointer-events-none z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#09090b]/95 via-[#09090b]/90 to-indigo-950/20 pointer-events-none z-0 hidden dark:block" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50/90 via-white/80 to-indigo-50/50 pointer-events-none z-0 dark:hidden" />
      
      {sessionWarning && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 backdrop-blur-sm text-black text-sm font-bold text-center py-2.5 px-4 flex items-center justify-center gap-3 shadow-lg">
          <ShieldAlert size={16} />
          Your vault will auto-lock in 2 minutes due to inactivity.
          <button
            onClick={() => { setSessionWarning(false); window.location.reload(); }}
            className="underline hover:no-underline ml-2"
          >
            Stay logged in
          </button>
        </div>
      )}
      
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 shadow-lg shadow-black/5 dark:shadow-black/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/30 border border-indigo-400/20">
                <ShieldCheck className="text-white drop-shadow-md" size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight leading-none">
                  SecureVault
                </h1>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-500 tracking-widest uppercase mt-0.5">Zero-Knowledge</p>
              </div>
            </div>
            <div className="hidden md:flex bg-slate-100 dark:bg-[#18181b] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <Link to="/vault" className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-indigo-500/30">
                Passwords
              </Link>
              <Link to="/notes" className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Secure Notes
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-[#18181b] rounded-xl hidden sm:block border border-slate-200 dark:border-slate-800"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/settings"
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:block"
            >
              Settings
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-200 dark:border-rose-500/20"
            >
              <LogOut size={16} /> Lock Vault
            </button>
          </div>
        </div>
      </nav>
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!loading && passwords.length > 0 && (
          <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
              <div className={`relative w-28 h-28 shrink-0 rounded-full flex items-center justify-center border-4 shadow-lg ${scoreColor} bg-slate-50 dark:bg-[#09090b]`}>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{vaultHealth.totalScore}</span>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  Vault Health{' '}
                  <ShieldAlert size={20} className={vaultHealth.totalScore === 100 ? 'text-indigo-500' : 'text-amber-500'} />
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Automated risk analysis of your decrypted local credentials.
                </p>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 bg-slate-50 dark:bg-[#09090b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center shadow-inner min-w-[120px]">
                <span className={`block text-3xl font-bold mb-1 ${vaultHealth.weakPasswords.length > 0 ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {vaultHealth.weakPasswords.length}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Weak</span>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-[#09090b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center shadow-inner min-w-[120px]">
                <span className={`block text-3xl font-bold mb-1 ${vaultHealth.reusedPasswords.length > 0 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {vaultHealth.reusedPasswords.length}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Reused</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 w-8 h-8 flex items-center justify-center rounded-xl text-sm border border-indigo-200 dark:border-indigo-500/30 font-black">+</span>
            Encrypt New Credential
          </h2>
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                placeholder="Site Name (e.g., GitHub)"
                value={newForm.site_name}
                onChange={e => setNewForm({ ...newForm, site_name: e.target.value })}
                required
              />
              <input
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                placeholder="Username / Email"
                value={newForm.username}
                onChange={e => setNewForm({ ...newForm, username: e.target.value })}
              />
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className={`w-3 h-3 rounded-full shadow-sm ${CATEGORY_COLORS[newForm.category] || 'bg-slate-400'}`} />
                </div>
                <select
                  className="w-full pl-10 pr-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none shadow-inner font-medium"
                  value={newForm.category}
                  onChange={e => setNewForm({ ...newForm, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-[#18181b]">{cat}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pr-20 pl-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] text-indigo-600 dark:text-indigo-400 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono tracking-wider shadow-inner"
                    placeholder="Secure Password"
                    value={newForm.password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-[#18181b] rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                      title="Copy password"
                      tabIndex="-1"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-white dark:bg-[#18181b] rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenerator(!showGenerator)}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all border whitespace-nowrap shadow-sm ${
                    showGenerator
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30'
                      : 'bg-white dark:bg-[#18181b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <Wand2 size={18} /> {showGenerator ? 'Hide Generator' : 'Generate'}
                </button>
              </div>
              <PasswordCriteria criteria={criteria} />
              {showGenerator && (
                <div className="mt-4 p-5 bg-slate-50 dark:bg-[#09090b] rounded-2xl border border-indigo-500/20 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                  <PasswordGenerator
                    onSelectPassword={(pwd) => {
                      setNewForm({ ...newForm, password: pwd });
                      setCriteria({ length: true, uppercase: true, lowercase: true, number: true, special: true });
                      setShowGenerator(false);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={newForm.password.length === 0}
                className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Encrypt & Save
              </button>
            </div>
          </form>
        </div>
        
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search encrypted vault..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="text-slate-400 dark:text-slate-500 hidden md:block" size={20} />
            <div
              className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              <button
                onClick={() => setFilterCategory('All')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                  filterCategory === 'All'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/20'
                    : 'bg-white dark:bg-[#09090b] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#27272a]'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                    filterCategory === cat
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30'
                      : 'bg-white dark:bg-[#09090b] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${CATEGORY_COLORS[cat]}`} />
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(n => <SkeletonCard key={n} />)
          ) : filteredPasswords.length > 0 ? (
            filteredPasswords.map(p => (
              <PasswordCard
                key={p.id}
                id={p.id}
                site_name={p.site_name}
                username={p.username}
                password={p.password}
                category={p.category}
                onUpdate={fetchPasswords}
                onCopy={(pwd) => {
                  navigator.clipboard.writeText(pwd);
                  toast.success("Password copied to clipboard", { icon: '📋' });
                }}
                onDelete={() => handleDelete(p.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 px-4 animate-in fade-in zoom-in-95 duration-500 max-w-lg mx-auto">
              {/* Indigo Shield Icon */}
              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2.5rem] border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-indigo-500/10 transform transition-transform hover:scale-105 duration-300">
                <ShieldOff size={44} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              
              {/* Text */}
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Your vault is empty</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                No credentials stored yet. Add your first password to start building your encrypted vault.
              </p>
              
              {/* Security Badges */}
              <div className="flex justify-center gap-3 mb-10 flex-wrap">
                {['AES-256 encrypted', 'Zero-knowledge', 'Stored locally'].map(badge => (
                  <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#18181b] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Lock size={12} className="text-indigo-500" /> {badge}
                  </span>
                ))}
              </div>

              {/* Indigo Add Button */}
              <button 
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
              >
                <Plus size={22} /> Add your first credential
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
