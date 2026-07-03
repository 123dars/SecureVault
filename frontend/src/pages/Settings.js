import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import api from '../api';
import { encryptData, decryptData, deriveKey } from '../crypto';
import toast from 'react-hot-toast';
import {
  ShieldAlert, Download, KeyRound, Loader2, ArrowLeft,
  Smartphone, QrCode, CheckCircle2, ShieldCheck, Eye, EyeOff, Trash2,
  Moon, Sun
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

function PasswordInput({ label, value, onChange, placeholder = '••••••••', disabled = false, children }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className="w-full pr-12 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 font-mono shadow-inner"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          disabled={disabled}
        />
        <button
          type="button"
          tabIndex="-1"
          onClick={() => setShow(s => !s)}
          className="absolute right-4 top-4 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {children}
    </div>
  );
}

function StrengthBar({ password }) {
  const getScore = (pw) => {
    let s = 0;
    if (pw.length >= 8)           s++;
    if (pw.length >= 12)          s++;
    if (/[A-Z]/.test(pw))         s++;
    if (/[0-9]/.test(pw))         s++;
    if (/[^A-Za-z0-9]/.test(pw))  s++;
    return s;
  };
  
  const levels = [
    { label: '',             color: ''                },
    { label: 'Very weak',   color: 'bg-rose-500'      },
    { label: 'Weak',        color: 'bg-amber-500'   },
    { label: 'Fair',        color: 'bg-yellow-400'   },
    { label: 'Strong',      color: 'bg-indigo-400'     },
    { label: 'Very strong', color: 'bg-indigo-600'  },
  ];
  
  if (!password) return null;
  const score = getScore(password);
  const level = levels[score] || levels[0];
  
  return (
    <div className="mt-3 space-y-1">
      <div className="flex gap-1.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? level.color : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>
      {level.label && <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mt-1">{level.label}</p>}
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const [oldPassword,     setOldPassword]     = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRotating,      setIsRotating]      = useState(false);

  const [isMfaEnabled,   setIsMfaEnabled]   = useState(false);
  const [mfaSetupData,   setMfaSetupData]   = useState(null);
  const [mfaCode,        setMfaCode]        = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  const [showDanger,    setShowDanger]    = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting,    setIsDeleting]    = useState(false);

  useEffect(() => {
    if (user?.mfa_enabled !== undefined) setIsMfaEnabled(user.mfa_enabled);
  }, [user]);

  const handleKeyRotation = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!"); return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters!"); return;
    }
    
    // AWAIT: deriveKey is asynchronous
    const derivedOldKey      = await deriveKey(oldPassword, user.username);
    const currentSessionKey  = sessionStorage.getItem('masterPassword');
    
    if (derivedOldKey !== currentSessionKey) {
      toast.error("Incorrect current master password!"); return;
    }
    
    setIsRotating(true);
    const loadingToast = toast.loading("Re-encrypting your vault… do not close this window.");
    try {
      const derivedNewKey = await deriveKey(newPassword, user.username);
      
      // FIXED: /api/passwords instead of /passwords
      const res = await api.get('/api/passwords');
      
      // AWAIT & Promise.all: map now awaits encryption/decryption
      const updatedPasswords = await Promise.all(res.data.map(async item => {
        const rawPass = await decryptData(item.encrypted_password, item.iv, currentSessionKey);
        const { ciphertext, iv } = await encryptData(rawPass, derivedNewKey);
        return { id: item.id, encrypted_password: ciphertext, iv };
      }));
      
      await api.post('/auth/rotate-key', { new_password: newPassword, updated_passwords: updatedPasswords });
      sessionStorage.setItem('masterPassword', derivedNewKey);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success("Master password updated successfully!", { id: loadingToast });
    } catch {
      toast.error("Failed to rotate keys.", { id: loadingToast });
    } finally {
      setIsRotating(false);
    }
  };

  const handleExport = async () => {
    const masterPassword = sessionStorage.getItem('masterPassword');
    if (!masterPassword) { toast.error("Session expired."); return; }
    try {
      // FIXED: /api/passwords instead of /passwords
      const res = await api.get('/api/passwords');
      let csvContent = "data:text/csv;charset=utf-8,Site,Username,Password,Category\n";
      
      // CHANGED: Use a for...of loop to properly await decryption
      for (const item of res.data) {
        const rawPass = await decryptData(item.encrypted_password, item.iv, masterPassword);
        csvContent += `"${item.site_name.replace(/"/g,'""')}","${(item.username||'').replace(/"/g,'""')}","${rawPass.replace(/"/g,'""')}","${item.category}"\n`;
      }
      
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `${user?.username}_vault_export.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("Vault exported successfully!");
    } catch {
      toast.error("Failed to export vault.");
    }
  };

  const startMfaSetup = async () => {
    try {
      const res = await api.post('/auth/mfa/setup');
      setMfaSetupData(res.data);
    } catch {
      toast.error("Failed to initialize MFA setup");
    }
  };

  const verifyMfa = async (e) => {
    e.preventDefault();
    if (mfaCode.length !== 6) { toast.error("Enter a 6-digit code"); return; }
    setIsVerifyingMfa(true);
    try {
      await api.post('/auth/mfa/verify', { code: mfaCode });
      toast.success("MFA Successfully Enabled!", { icon: '🛡️' });
      setIsMfaEnabled(true); setMfaSetupData(null); setMfaCode('');
    } catch {
      toast.error("Invalid verification code.");
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirm !== 'DELETE ACCOUNT') {
      toast.error("Type exactly 'DELETE ACCOUNT' to confirm."); return;
    }
    setIsDeleting(true);
    try {
      await api.delete('/auth/account');
      toast.success("Account permanently deleted.");
      logout();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] font-sans selection:bg-indigo-500/30 pb-20 relative animate-in fade-in duration-300">

      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center opacity-[0.03] dark:opacity-[0.05] mix-blend-luminosity pointer-events-none z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }} />
      <div className="fixed inset-0 bg-gradient-to-br from-[#09090b]/95 via-[#09090b]/90 to-indigo-950/20 pointer-events-none z-0 hidden dark:block" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50/90 via-white/80 to-indigo-50/50 pointer-events-none z-0 dark:hidden" />

      {/* Header */}
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
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-500 tracking-widest uppercase mt-0.5">Settings</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-slate-800"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/vault" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Return to Vault</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <header className="mb-2 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Cryptographic Controls</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm font-medium">Manage your encryption keys, multi-factor authentication, and data.</p>
        </header>

        {/* ── 2FA PANEL ── */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 rounded-xl border bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
              <Smartphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add an extra layer of security to your vault using an authenticator app.</p>
            </div>
          </div>

          {isMfaEnabled ? (
            <div className="flex items-center gap-3 p-5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold shadow-inner">
              <CheckCircle2 size={22} className="text-indigo-500" /> MFA is actively protecting your account.
            </div>
          ) : !mfaSetupData ? (
            <button
              onClick={startMfaSetup}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              <QrCode size={20} /> Setup Authenticator App
            </button>
          ) : (
            <div className="bg-slate-50 dark:bg-[#09090b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-8 items-start shadow-inner">
              <div className="bg-white p-4 rounded-2xl flex-shrink-0 mx-auto md:mx-0 shadow-lg border border-slate-200 dark:border-transparent">
                <QRCodeSVG value={mfaSetupData.uri} size={150} />
              </div>
              <div className="w-full">
                <h3 className="text-slate-900 dark:text-white font-bold mb-2">1. Scan this QR Code</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Open Google Authenticator or Authy and scan. Or enter this code manually:</p>
                <code className="block p-4 bg-white dark:bg-[#18181b] border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-2xl text-center font-mono tracking-widest mb-6 shadow-sm font-bold">
                  {mfaSetupData.secret}
                </code>
                <h3 className="text-slate-900 dark:text-white font-bold mb-2">2. Enter Verification Code</h3>
                <form onSubmit={verifyMfa} className="flex gap-3">
                  <input
                    type="text" maxLength="6" placeholder="000000" value={mfaCode}
                    onChange={e => setMfaCode(e.target.value)}
                    className="flex-1 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181b] text-slate-900 dark:text-white text-center text-xl tracking-[0.3em] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono transition-all shadow-sm"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingMfa}
                    className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-70"
                  >
                    {isVerifyingMfa ? <Loader2 className="animate-spin" size={20} /> : "Verify"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ── KEY ROTATION PANEL ── */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
              <KeyRound size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rotate Cryptographic Keys</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This will re-encrypt your entire vault. Do not close the window while this is running.</p>
            </div>
          </div>

          {isRotating && (
            <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-400 text-sm font-bold animate-pulse">
              <ShieldAlert size={18} className="flex-shrink-0" />
              Re-encrypting vault… Do not close or refresh this window.
            </div>
          )}

          <form onSubmit={handleKeyRotation} className="space-y-6 max-w-md">
            <PasswordInput
              label="Current Master Password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              disabled={isRotating}
            />
            <PasswordInput
              label="New Master Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              disabled={isRotating}
            >
              <StrengthBar password={newPassword} />
            </PasswordInput>
            <PasswordInput
              label="Confirm New Master Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isRotating}
            >
              {confirmPassword.length > 0 && (
                <p className={`text-xs mt-2 font-bold ${newPassword === confirmPassword ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </PasswordInput>
            <button
              type="submit"
              disabled={isRotating}
              className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-70"
            >
              {isRotating
                ? <><Loader2 className="animate-spin" size={20} /> Re-encrypting…</>
                : "Re-Encrypt Vault"}
            </button>
          </form>
        </div>

        {/* ── DATA EXPORT PANEL ── */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 bg-slate-100 dark:bg-[#09090b] text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Download size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Export Vault Data</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Download a decrypted CSV of your vault. Store this file in a safe, offline place.</p>
            </div>
          </div>

          <div className="p-5 bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/30 rounded-2xl flex items-start gap-4 mb-6 shadow-inner">
            <ShieldAlert size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 dark:text-amber-200/90 font-medium leading-relaxed">
              <span className="font-bold text-amber-600 dark:text-amber-400">Warning:</span> Exporting to CSV removes encryption from your passwords. Anyone with access to the downloaded file will be able to read your credentials. Store it securely and delete it when done.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center justify-center sm:justify-start gap-2 px-6 py-3.5 bg-white dark:bg-[#09090b] text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-all border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#27272a] shadow-sm"
          >
            <Download size={18} /> Download Decrypted CSV
          </button>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-rose-200 dark:border-rose-500/20 shadow-xl mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl border border-rose-200 dark:border-rose-500/30 shadow-sm">
                <Trash2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Danger Zone</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Irreversible actions. Proceed with extreme caution.</p>
              </div>
            </div>
            <button
              onClick={() => setShowDanger(d => !d)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border w-full sm:w-auto ${
                showDanger 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20' 
                  : 'bg-white border-slate-200 text-slate-600 dark:bg-[#09090b] dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#27272a]'
              }`}
            >
              {showDanger ? 'Hide Danger Zone' : 'Show Danger Zone'}
            </button>
          </div>

          {showDanger && (
            <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl mb-6 shadow-inner">
                <p className="text-sm text-rose-800 dark:text-rose-200/90 font-medium leading-relaxed">
                  Deleting your account will{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400">permanently destroy</span>{' '}
                  your vault and all saved credentials. This action cannot be undone. Your encrypted data will be wiped from our servers immediately.
                </p>
              </div>
              <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider mb-2">
                    Type "DELETE ACCOUNT" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE ACCOUNT"
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-rose-500/50 bg-slate-50 dark:bg-[#09090b] text-rose-600 dark:text-rose-400 font-mono tracking-widest text-center focus:border-rose-500 focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-700 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDeleting || deleteConfirm !== 'DELETE ACCOUNT'}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/30"
                >
                  {isDeleting
                    ? <Loader2 className="animate-spin" size={20} />
                    : <><Trash2 size={18} /> Permanently Delete Account</>}
                </button>
              </form>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
