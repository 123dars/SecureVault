import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Copy, ShieldCheck, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers:   '0123456789',
  symbols:   '!@#$%^&*()_+~|{}[]:;<>?,./-=',
};

const POOL_SIZES = { uppercase: 26, lowercase: 26, numbers: 10, symbols: 30 };

function calcEntropy(length, opts) {
  const pool = Object.entries(opts).reduce((s, [k, v]) => v ? s + POOL_SIZES[k] : s, 0);
  return Math.round(length * Math.log2(pool || 1));
}

function strengthFromBits(bits) {
  if (bits < 40)  return { label: 'Weak',        filled: 1, color: 'bg-rose-500',    text: 'text-rose-400'    };
  if (bits < 60)  return { label: 'Fair',        filled: 2, color: 'bg-amber-400',   text: 'text-amber-400'   };
  if (bits < 80)  return { label: 'Good',        filled: 3, color: 'bg-emerald-400', text: 'text-emerald-400' };
  if (bits < 100) return { label: 'Strong',      filled: 4, color: 'bg-emerald-400', text: 'text-emerald-400' };
  return               { label: 'Very strong', filled: 5, color: 'bg-emerald-400', text: 'text-emerald-400' };
}

export default function PasswordGenerator({ onSelectPassword }) {
  const [length, setLength]     = useState(16);
  const [options, setOptions]   = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [password, setPassword] = useState('');
  const [copied, setCopied]     = useState(false);
  const [spinning, setSpinning] = useState(false);
  const spinRef = useRef(null);

  const generate = useCallback(() => {
    let pool = '', pw = '';
    for (const [key, on] of Object.entries(options)) {
      if (on) {
        pool += CHARSETS[key];
        pw += CHARSETS[key][Math.floor(Math.random() * CHARSETS[key].length)];
      }
    }
    if (!pool) return;
    for (let i = pw.length; i < length; i++) pw += pool[Math.floor(Math.random() * pool.length)];
    setPassword(pw.split('').sort(() => Math.random() - 0.5).join(''));
  }, [length, options]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleRefresh = () => {
    setSpinning(true);
    generate();
    clearTimeout(spinRef.current);
    spinRef.current = setTimeout(() => setSpinning(false), 500);
  };

  const toggleOption = (key) => {
    if (options[key] && Object.values(options).filter(Boolean).length === 1) return;
    setOptions(o => ({ ...o, [key]: !o[key] }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied!', { style: { background: '#1e293b', color: '#fff' } });
    onSelectPassword?.(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const bits     = calcEntropy(length, options);
  const strength = strengthFromBits(bits);

  return (
    <div className="bg-[#0B0F19]/80 rounded-2xl border border-slate-700/50 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="text-emerald-500" size={20} />
        <h3 className="text-white font-bold">Secure Generator</h3>
      </div>

      {/* Password display */}
      <div className="relative mb-3">
        <div className="w-full bg-[#111827] border border-emerald-500/30 text-emerald-400 font-mono text-center text-lg md:text-xl p-4 pr-12 rounded-xl break-all tracking-widest min-h-[60px] flex items-center justify-center">
          {password}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors p-2"
          aria-label="Regenerate password"
        >
          <RefreshCw size={18} className={spinning ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Entropy meter */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] text-slate-500">Entropy</span>
          <span className={`text-[11px] font-semibold ${strength.text}`}>
            {strength.label} · {bits} bits
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`h-[4px] flex-1 rounded-full transition-all duration-300 ${
                i <= strength.filled ? strength.color : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {/* Length slider */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400 font-semibold">Length</span>
            <span className="text-emerald-500 font-bold">{length}</span>
          </div>
          <input
            type="range"
            min="8" max="64" step="1"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Option toggles */}
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(options).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => toggleOption(key)}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border
                ${options[key]
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-500 border-slate-700/50 hover:bg-slate-800'
                }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border shadow-md
            ${copied
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
            }`}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied!' : 'Use & Copy Password'}
        </button>
      </div>
    </div>
  );
}