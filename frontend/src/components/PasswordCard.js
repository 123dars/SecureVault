import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Eye, EyeOff, Check, User, AlertTriangle } from 'lucide-react';
const CATEGORY_STYLES = {
  social:   { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20'  },
  finance:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  work:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20'     },
  shopping: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  other:    { bg: 'bg-slate-700/50',   text: 'text-slate-600 dark:text-slate-400',   border: 'border-slate-600/30'   },
};
function getStrength(pw = '') {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw))   score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak',   filled: 1, color: 'bg-rose-500'   };
  if (score === 2) return { label: 'Fair',   filled: 2, color: 'bg-amber-400'  };
  if (score === 3) return { label: 'Good',   filled: 3, color: 'bg-emerald-400'};
  return              { label: 'Strong', filled: 4, color: 'bg-emerald-400'};
}
export default function PasswordCard({ site_name, username, password, category = 'other', onCopy, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isLeaked, setIsLeaked] = useState(false);
  const [leakCount, setLeakCount] = useState(0);
  const cat = CATEGORY_STYLES[category?.toLowerCase()] ?? CATEGORY_STYLES.other;
  const strength = getStrength(password);
  useEffect(() => {
    async function checkLeak() {
      if (!password) return;
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        const prefix = hashHex.slice(0, 5);
        const suffix = hashHex.slice(5);
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (response.ok) {
          const text = await response.text();
          const lines = text.split('\n');
          
          for (const line of lines) {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix.trim() === suffix) {
              setIsLeaked(true);
              setLeakCount(parseInt(count, 10));
              break;
            }
          }
        }
      } catch (err) {
        console.error("Leak check failed (maybe offline)", err);
      }
    }
    checkLeak();
  }, [password]);
  const handleCopy = () => {
    onCopy?.(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className={`group relative bg-white dark:bg-[#111827]/60 backdrop-blur-md p-5 rounded-3xl border shadow-xl transition-all duration-300 flex flex-col ${isLeaked ? 'border-rose-500/50 shadow-rose-900/20' : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-600/60'}`}>
      <div className="flex justify-between items-start">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cat.bg} ${cat.text} ${cat.border}`}>
          {category}
        </span>
        
        {isLeaked && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-bold uppercase animate-pulse">
            <AlertTriangle size={12} />
            Leaked {leakCount.toLocaleString()} times
          </span>
        )}
      </div>
      <h3 className="mt-2.5 mb-0.5 text-base font-bold text-slate-900 dark:text-white truncate">{site_name}</h3>
      <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4 truncate">
        <User size={11} className="shrink-0" />
        {username || 'No username'}
      </p>
      <div className={`relative bg-slate-50 dark:bg-[#0B0F19]/70 px-3 py-2.5 rounded-xl border flex items-center gap-2 mb-3 ${isLeaked ? 'border-rose-500/30' : 'border-slate-200 dark:border-slate-700/50'}`}>
        <span className={`flex-1 font-mono text-sm truncate ${showPassword ? (isLeaked ? 'text-rose-400' : 'text-emerald-400') : 'text-slate-500 dark:text-slate-500 tracking-[4px]'}`}>
          {showPassword ? password : '••••••••••••'}
        </span>
        <button
          onClick={() => setShowPassword(v => !v)}
          className="shrink-0 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors"
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <div className="flex-grow"></div>
      <div className="mb-4 mt-auto">
        <p className="text-[10px] text-slate-500 dark:text-slate-500 mb-1.5">
          Strength: <span className={`font-semibold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i <= strength.filled ? strength.color : 'bg-slate-700'}`}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200
            ${copied
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 scale-[0.98]'
              : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:border-emerald-500 hover:text-slate-900 dark:text-white'}`}
        >
          {copied ? <Check size={15} className="animate-bounce-once" /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={onDelete}
          className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-slate-900 dark:text-white hover:border-rose-500 transition-all duration-200"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
