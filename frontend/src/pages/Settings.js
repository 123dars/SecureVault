import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import api from '../api';
import { encryptData, decryptData, deriveKey } from '../crypto';
import toast from 'react-hot-toast';
import {
  ShieldAlert, Download, KeyRound, Loader2, ArrowLeft,
  Smartphone, QrCode, CheckCircle2, ShieldCheck, Eye, EyeOff, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const TOAST_DARK  = { style: { background: '#1e293b', color: '#fff' } };
const TOAST_GREEN = { style: { background: '#059669', color: '#fff' } };

function PasswordInput({ label, value, onChange, placeholder = '••••••••', disabled = false, children }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className="w-full pr-12 p-3.5 rounded-xl border border-slate-700/50 bg-[#0B0F19]/50 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600 font-mono"
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
          className="absolute right-3.5 top-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
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
    { label: 'Very weak',   color: 'bg-red-500'      },
    { label: 'Weak',        color: 'bg-orange-500'   },
    { label: 'Fair',        color: 'bg-yellow-500'   },
    { label: 'Strong',      color: 'bg-lime-500'     },
    { label: 'Very strong', color: 'bg-emerald-500'  },
  ];
  if (!password) return null;
  const score = getScore(password);
  const level = levels[score] || levels[0];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? level.color : 'bg-slate-700'}`} />
        ))}
      </div>
      {level.label && <p className="text-xs text-slate-500">{level.label}</p>}
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useContext(AuthContext);

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
      toast.error("New passwords do not match!", TOAST_DARK); return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters!", TOAST_DARK); return;
    }
    const derivedOldKey      = deriveKey(oldPassword, user.username);
    const currentSessionKey  = sessionStorage.getItem('masterPassword');
    if (derivedOldKey !== currentSessionKey) {
      toast.error("Incorrect current master password!", TOAST_DARK); return;
    }
    setIsRotating(true);
    const loadingToast = toast.loading("Re-encrypting your vault… do not close this window.", TOAST_DARK);
    try {
      const derivedNewKey = deriveKey(newPassword, user.username);
      const res = await api.get('/api/passwords');
      const updatedPasswords = res.data.map(item => {
        const rawPass = decryptData(item.encrypted_password, item.iv, currentSessionKey);
        const { ciphertext, iv } = encryptData(rawPass, derivedNewKey);
        return { id: item.id, encrypted_password: ciphertext, iv };
      });
      await api.post('/auth/rotate-key', { new_password: newPassword, updated_passwords: updatedPasswords });
      sessionStorage.setItem('masterPassword', derivedNewKey);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success("Master password updated successfully!", { id: loadingToast, ...TOAST_GREEN });
    } catch {
      toast.error("Failed to rotate keys.", { id: loadingToast, ...TOAST_DARK });
    } finally {
      setIsRotating(false);
    }
  };

  const handleExport = async () => {
    const masterPassword = sessionStorage.getItem('masterPassword');
    if (!masterPassword) { toast.error("Session expired.", TOAST_DARK); return; }
    try {
      const res = await api.get('/api/passwords');
      let csvContent = "data:text/csv;charset=utf-8,Site,Username,Password,Category\n";
      res.data.forEach(item => {
        const rawPass = decryptData(item.encrypted_password, item.iv, masterPassword);
        csvContent += `"${item.site_name.replace(/"/g,'""')}","${(item.username||'').replace(/"/g,'""')}","${rawPass.replace(/"/g,'""')}","${item.category}"\n`;
      });
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `${user?.username}_vault_export.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("Vault exported successfully!", TOAST_GREEN);
    } catch {
      toast.error("Failed to export vault.", TOAST_DARK);
    }
  };

  const startMfaSetup = async () => {
    try {
      const res = await api.post('/auth/mfa/setup');
      setMfaSetupData(res.data);
    } catch {
      toast.error("Failed to initialize MFA setup", TOAST_DARK);
    }
  };

  const verifyMfa = async (e) => {
    e.preventDefault();
    if (mfaCode.length !== 6) { toast.error("Enter a 6-digit code", TOAST_DARK); return; }
    setIsVerifyingMfa(true);
    try {
      await api.post('/auth/mfa/verify', { code: mfaCode });
      toast.success("MFA Successfully Enabled!", TOAST_GREEN);
      setIsMfaEnabled(true); setMfaSetupData(null); setMfaCode('');
    } catch {
      toast.error("Invalid verification code.", TOAST_DARK);
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirm !== 'DELETE ACCOUNT') {
      toast.error("Type exactly 'DELETE ACCOUNT' to confirm.", TOAST_DARK); return;
    }
    setIsDeleting(true);
    try {
      await api.delete('/auth/account');
      toast.success("Account permanently deleted.", TOAST_DARK);
      logout();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete account.", TOAST_DARK);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans selection:bg-emerald-500/30 pb-20 relative animate-in fade-in duration-300">

      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }} />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B0F19]/95 via-[#0B0F19]/90 to-emerald-950/40 pointer-events-none z-0" />

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#111827]/80 backdrop-blur-xl border-b border-slate-800/60 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <ShieldCheck size={24} className="text-emerald-500" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Security Settings</span>
          </div>
          <Link to="/vault" className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft size={16} /> Return to Vault
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <header className="mb-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Cryptographic Controls</h1>
          <p className="text-slate-400 mt-2 text-sm">Manage your encryption keys, multi-factor authentication, and data.</p>
        </header>

        {/* ── 2FA PANEL ── */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/80">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 rounded-xl border shadow-lg bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-900/20">
              <Smartphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Two-Factor Authentication (2FA)</h2>
              <p className="text-sm text-slate-400 mt-1">Add an extra layer of security to your vault using an authenticator app.</p>
            </div>
          </div>

          {isMfaEnabled ? (
            <div className="flex items-center gap-3 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 font-semibold shadow-inner">
              <CheckCircle2 size={22} /> MFA is actively protecting your account.
            </div>
          ) : !mfaSetupData ? (
            <button
              onClick={startMfaSetup}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
            >
              <QrCode size={20} /> Setup Authenticator App
            </button>
          ) : (
            <div className="bg-[#0B0F19]/60 p-6 rounded-2xl border border-slate-700/50 flex flex-col md:flex-row gap-8 items-start shadow-inner">
              <div className="bg-white p-4 rounded-2xl flex-shrink-0 mx-auto md:mx-0 shadow-lg shadow-black/50">
                <QRCodeSVG value={mfaSetupData.uri} size={150} />
              </div>
              <div className="w-full">
                <h3 className="text-white font-bold mb-2">1. Scan this QR Code</h3>
                <p className="text-slate-400 text-sm mb-4">Open Google Authenticator or Authy and scan. Or enter this code manually:</p>
                <code className="block p-4 bg-[#111827] border border-emerald-500/30 text-emerald-400 rounded-xl text-center font-mono tracking-widest mb-6 shadow-inner">
                  {mfaSetupData.secret}
                </code>
                <h3 className="text-white font-bold mb-2">2. Enter Verification Code</h3>
                <form onSubmit={verifyMfa} className="flex gap-3">
                  <input
                    type="text" maxLength="6" placeholder="000000" value={mfaCode}
                    onChange={e => setMfaCode(e.target.value)}
                    className="flex-1 p-3.5 rounded-xl border border-slate-700/50 bg-[#111827] text-white text-center text-lg tracking-widest focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingMfa}
                    className="px-8 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-70"
                  >
                    {isVerifyingMfa ? <Loader2 className="animate-spin" size={20} /> : "Verify"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ── KEY ROTATION PANEL ── */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/80">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-lg shadow-emerald-900/20">
              <KeyRound size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Rotate Cryptographic Keys</h2>
              <p className="text-sm text-slate-400 mt-1">This will re-encrypt your entire vault. Do not close the window while this is running.</p>
            </div>
          </div>

          {isRotating && (
            <div className="mb-5 flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-semibold animate-pulse">
              <ShieldAlert size={18} className="flex-shrink-0" />
              Re-encrypting vault… Do not close or refresh this window.
            </div>
          )}

          <form onSubmit={handleKeyRotation} className="space-y-5 max-w-md">
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
                <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </PasswordInput>
            <button
              type="submit"
              disabled={isRotating}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-70"
            >
              {isRotating
                ? <><Loader2 className="animate-spin" size={20} /> Re-encrypting…</>
                : "Re-Encrypt Vault"}
            </button>
          </form>
        </div>

        {/* ── DATA EXPORT PANEL ── */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/80">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 bg-slate-800/80 text-slate-300 rounded-xl border border-slate-600/50 shadow-lg">
              <Download size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Export Vault Data</h2>
              <p className="text-sm text-slate-400 mt-1">Download a decrypted CSV of your vault. Store this file in a safe, offline place.</p>
            </div>
          </div>

          {/* ⚠️ Amber warning — not green */}
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl flex items-start gap-3 mb-6 shadow-inner">
            <ShieldAlert size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/80 font-medium leading-relaxed">
              <span className="font-bold text-amber-400">Warning:</span> Exporting to CSV removes encryption from your passwords. Anyone with access to the downloaded file will be able to read your credentials. Store it securely and delete it when done.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-600 shadow-md"
          >
            <Download size={18} /> Download Decrypted CSV
          </button>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="bg-[#111827]/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-rose-500/20 shadow-2xl shadow-black/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              {/* 🔴 Rose icon for danger */}
              <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/30 shadow-lg shadow-rose-900/20">
                <Trash2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Danger Zone</h2>
                <p className="text-sm text-slate-400 mt-1">Irreversible actions. Proceed with extreme caution.</p>
              </div>
            </div>
            <button
              onClick={() => setShowDanger(d => !d)}
              className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors px-3 py-1.5 border border-slate-700 hover:border-rose-500/30 rounded-lg"
            >
              {showDanger ? 'Hide' : 'Show'}
            </button>
          </div>

          {showDanger && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl mb-6">
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  Deleting your account will{' '}
                  <span className="font-bold text-rose-400">permanently destroy</span>{' '}
                  your vault and all saved credentials. This action cannot be undone. Your encrypted data will be wiped from our servers immediately.
                </p>
              </div>
              <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                    Type "DELETE ACCOUNT" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE ACCOUNT"
                    className="w-full p-3.5 rounded-xl border border-slate-700/50 bg-[#0B0F19]/50 text-rose-400 font-mono tracking-widest text-center focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all placeholder-slate-600"
                  />
                </div>
                {/* 🔴 Rose delete button */}
                <button
                  type="submit"
                  disabled={isDeleting || deleteConfirm !== 'DELETE ACCOUNT'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-900/20"
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