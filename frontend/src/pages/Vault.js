import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import api from '../api';
import { encryptData, decryptData } from '../crypto';
import { runSecurityAudit } from '../utils/securityAudit';
import PasswordCard from '../components/PasswordCard';
import EmptyVault from '../components/EmptyVault';
import SkeletonCard from '../components/SkeletonCard';
import PasswordGenerator from '../components/PasswordGenerator';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Circle, Search, Filter, ShieldCheck,
  LogOut, Wand2, ShieldAlert, Copy, Eye, EyeOff, ChevronDown
} from 'lucide-react';

const CATEGORIES = ['General', 'Work', 'Finance', 'Social', 'Gaming', 'Shopping'];

const CATEGORY_COLORS = {
  General:  'bg-slate-400',
  Work:     'bg-blue-400',
  Finance:  'bg-emerald-400',
  Social:   'bg-purple-400',
  Gaming:   'bg-rose-400',
  Shopping: 'bg-amber-400',
};

function StrengthBar({ criteria }) {
  const met = Object.values(criteria).filter(Boolean).length;
  const levels = [
    { label: '',             color: ''                },
    { label: 'Very weak',   color: 'bg-red-500'      },
    { label: 'Weak',        color: 'bg-orange-500'   },
    { label: 'Fair',        color: 'bg-yellow-500'   },
    { label: 'Strong',      color: 'bg-lime-500'     },
    { label: 'Very strong', color: 'bg-emerald-500'  },
  ];
  const level = levels[met] || levels[0];
  if (met === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= met ? level.color : 'bg-slate-700'}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">{level.label}</p>
    </div>
  );
}

export default function Vault() {
  const { user, logout } = useContext(AuthContext);
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
      const res = await api.get('/api/passwords');
      const decryptedVault = res.data.map(item => ({
        ...item,
        password: decryptData(item.encrypted_password, item.iv, masterPassword),
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
    vaultHealth.totalScore === 100 ? 'text-emerald-400 border-emerald-500' :
    vaultHealth.totalScore >= 70   ? 'text-amber-400 border-amber-500'     :
                                     'text-rose-400 border-rose-500';

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
    toast.success("Password copied!", { icon: '📋', style: { background: '#1e293b', color: '#fff' } });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!masterPassword) {
      toast.error("Security session expired! Please click 'Lock Vault' and log in again.", { style: { background: '#1e293b', color: '#fff' } });
      return;
    }
    
    // NEW LOGIC: Only check if they actually typed a password.
    // It doesn't matter if it's "weak" or just 4 numbers for a Bank PIN.
    if (newForm.password.length === 0) {
      toast.error("Please enter a password or PIN!", { style: { background: '#1e293b', color: '#fff' } });
      return;
    }

    try {
      const { ciphertext, iv } = encryptData(newForm.password, masterPassword);
      await api.post('/api/passwords', {
        site_name:          newForm.site_name,
        username:           newForm.username,
        encrypted_password: ciphertext,
        iv,
        category:           newForm.category,
      });
      setNewForm({ site_name: '', username: '', password: '', category: 'General' });
      setCriteria({ length: false, uppercase: false, lowercase: false, number: false, special: false });
      setShowGenerator(false);
      setShowPassword(false);
      fetchPasswords();
      toast.success("Credential securely encrypted & saved!", { icon: '🔐', style: { background: '#059669', color: '#fff' } });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save credential.", { style: { background: '#1e293b', color: '#fff' } });
    }
  };

  // Toast-based confirm instead of native window.confirm
  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-white">Delete this credential?</span>
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.delete(`/api/passwords/${id}`);
              setPasswords(prev => prev.filter(p => p.id !== id));
              toast.success("Credential destroyed!", { icon: '🗑️', style: { background: '#1e293b', color: '#fff' } });
            } catch {
              toast.error("Failed to delete credential.", { style: { background: '#1e293b', color: '#fff' } });
            }
          }}
          className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    ), { style: { background: '#1e293b', color: '#fff' }, duration: 8000 });
  };

  const CriteriaItem = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-300 ${
      met
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
        : 'bg-slate-800/50 text-slate-500 border-slate-700/50'
    }`}>
      {met ? <CheckCircle2 size={13} /> : <Circle size={13} />}
      {text}
    </div>
  );

  const filteredPasswords = passwords.filter(p => {
    const matchesSearch   = p.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Scroll to form when EmptyVault CTA is clicked
  const scrollToForm = () => {
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans selection:bg-emerald-500/30 pb-20 relative animate-in fade-in duration-300">

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B0F19]/95 via-[#0B0F19]/90 to-emerald-950/40 pointer-events-none z-0" />

      {/* Session timeout warning */}
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

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#111827]/80 backdrop-blur-xl border-b border-slate-800/60 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <ShieldCheck size={24} className="text-emerald-500" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SecureVault
              <span className="text-slate-500 font-normal text-sm ml-2 hidden sm:inline-block">
                | Connected as <span className="text-emerald-400">{user?.username}</span>
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className="text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors hidden sm:block"
            >
              Settings
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
            >
              <LogOut size={16} /> Lock Vault
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Vault Health Dashboard */}
        {!loading && passwords.length > 0 && (
          <div className="bg-[#111827]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/80 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
              <div className={`relative w-28 h-28 shrink-0 rounded-full flex items-center justify-center border-4 shadow-lg ${scoreColor} bg-[#0B0F19]`}>
                <span className="text-4xl font-extrabold">{vaultHealth.totalScore}</span>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  Vault Health{' '}
                  <ShieldAlert size={20} className={vaultHealth.totalScore === 100 ? 'text-emerald-500' : 'text-amber-500'} />
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  Automated risk analysis of your decrypted local credentials.
                </p>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 bg-[#0B0F19]/60 p-4 rounded-2xl border border-slate-700/50 text-center shadow-inner min-w-[120px]">
                <span className={`block text-3xl font-bold mb-1 ${vaultHealth.weakPasswords.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {vaultHealth.weakPasswords.length}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Weak</span>
              </div>
              <div className="flex-1 bg-[#0B0F19]/60 p-4 rounded-2xl border border-slate-700/50 text-center shadow-inner min-w-[120px]">
                <span className={`block text-3xl font-bold mb-1 ${vaultHealth.reusedPasswords.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {vaultHealth.reusedPasswords.length}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Reused</span>
              </div>
            </div>
          </div>
        )}

        {/* Add New Credential Form */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/80 mb-10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-500 w-8 h-8 flex items-center justify-center rounded-full text-sm border border-emerald-500/30">+</span>
            Encrypt New Credential
          </h2>

          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                className="p-3.5 rounded-xl border border-slate-700/50 bg-[#0B0F19]/50 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Site Name (e.g., GitHub)"
                value={newForm.site_name}
                onChange={e => setNewForm({ ...newForm, site_name: e.target.value })}
                required
              />
              <input
                className="p-3.5 rounded-xl border border-slate-700/50 bg-[#0B0F19]/50 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Username / Email"
                value={newForm.username}
                onChange={e => setNewForm({ ...newForm, username: e.target.value })}
              />
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[newForm.category] || 'bg-slate-400'}`} />
                </div>
                <select
                  className="w-full pl-8 pr-10 py-3.5 rounded-xl border border-slate-700/50 bg-[#0B0F19]/50 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none"
                  value={newForm.category}
                  onChange={e => setNewForm({ ...newForm, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pr-20 pl-4 py-3.5 rounded-xl border border-slate-700/50 bg-[#0B0F19]/50 text-emerald-400 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono tracking-wider"
                    placeholder="Secure Password"
                    value={newForm.password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
                      title="Copy password"
                      tabIndex="-1"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenerator(!showGenerator)}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all border whitespace-nowrap ${
                    showGenerator
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Wand2 size={18} /> {showGenerator ? 'Hide Generator' : 'Generate'}
                </button>
              </div>

              <StrengthBar criteria={criteria} />

              {showGenerator && (
                <div className="mt-4 p-5 bg-[#0B0F19]/80 rounded-2xl border border-emerald-500/20 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                  <PasswordGenerator
                    onSelectPassword={(pwd) => {
                      setNewForm({ ...newForm, password: pwd });
                      setCriteria({ length: true, uppercase: true, lowercase: true, number: true, special: true });
                      setShowGenerator(false);
                    }}
                  />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <CriteriaItem met={criteria.length}    text="8+ chars"  />
                <CriteriaItem met={criteria.uppercase} text="Uppercase"  />
                <CriteriaItem met={criteria.lowercase} text="Lowercase"  />
                <CriteriaItem met={criteria.number}    text="Number"     />
                <CriteriaItem met={criteria.special}   text="Symbol"     />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                // NEW LOGIC: Only disable if the password field is empty
                disabled={newForm.password.length === 0}
                className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Encrypt & Save
              </button>
            </div>
          </form>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111827]/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3.5 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search encrypted vault..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700/50 bg-[#0B0F19]/50 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="text-slate-500 hidden md:block" size={20} />
            <div
              className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              <button
                onClick={() => setFilterCategory('All')}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  filterCategory === 'All'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    filterCategory === cat
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]}`} />
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Password Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(n => <SkeletonCard key={n} />)
          ) : filteredPasswords.length > 0 ? (
            filteredPasswords.map(p => (
              <PasswordCard
                key={p.id}
                site_name={p.site_name}
                username={p.username}
                password={p.password}
                category={p.category}
                onCopy={() => {
                  navigator.clipboard.writeText(p.password);
                  toast.success("Password copied to clipboard", { icon: '📋', style: { background: '#1e293b', color: '#fff' } });
                }}
                onDelete={() => handleDelete(p.id)}
              />
            ))
          ) : (
            <EmptyVault onAdd={scrollToForm} />
          )}
        </div>

      </main>
    </div>
  );
}
