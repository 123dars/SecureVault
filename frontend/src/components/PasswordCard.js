import React, { useState } from 'react';
import { Copy, Trash2, Eye, EyeOff, Check, User } from 'lucide-react';

const CATEGORY_STYLES = {
  social:   { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20'  },
  finance:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  work:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20'     },
  shopping: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  other:    { bg: 'bg-slate-700/50',   text: 'text-slate-400',   border: 'border-slate-600/30'   },
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

  const cat = CATEGORY_STYLES[category?.toLowerCase()] ?? CATEGORY_STYLES.other;
  const strength = getStrength(password);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="group relative bg-[#111827]/60 backdrop-blur-md p-5 rounded-3xl border border-slate-700/50 shadow-xl hover:border-slate-600/60 transition-all duration-300">

      {/* Category badge */}
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cat.bg} ${cat.text} ${cat.border}`}>
        {category}
      </span>

      {/* Site + username */}
      <h3 className="mt-2.5 mb-0.5 text-base font-bold text-white truncate">{site_name}</h3>
      <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 truncate">
        <User size={11} className="shrink-0" />
        {username || 'No username'}
      </p>

      {/* Password row */}
      <div className="relative bg-[#0B0F19]/70 px-3 py-2.5 rounded-xl border border-slate-700/50 mb-3 flex items-center gap-2">
        <span className={`flex-1 font-mono text-sm truncate ${showPassword ? 'text-emerald-400 tracking-wider' : 'text-slate-500 tracking-[4px]'}`}>
          {showPassword ? password : '••••••••••••'}
        </span>
        <button
          onClick={() => setShowPassword(v => !v)}
          className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {/* Strength meter */}
      <div className="mb-4">
        <p className="text-[10px] text-slate-500 mb-1.5">
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

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200
            ${copied
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 scale-[0.98]'
              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white'}`}
        >
          {copied ? <Check size={15} className="animate-bounce-once" /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy password'}
        </button>

        <button
          onClick={onDelete}
          className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white hover:border-rose-500 transition-all duration-200"
          aria-label="Delete credential"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}