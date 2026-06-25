import React from 'react';
import { ShieldOff, Lock, EyeOff, HardDrive, Plus } from 'lucide-react';

export default function EmptyVault({ onAdd }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">

      {/* Animated shield */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-8">
        {/* Outer ping rings */}
        <span className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" style={{ animationDuration: '2.4s' }} />
        <span className="absolute -inset-3 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '0.6s' }} />
        {/* Glow */}
        <span className="absolute inset-0 rounded-full bg-emerald-500/8 animate-pulse" />
        {/* Icon circle */}
        <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shadow-xl shadow-emerald-900/20"
          style={{ animation: 'float 3.5s ease-in-out infinite' }}>
          <ShieldOff size={38} className="text-emerald-500" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Your vault is empty</h3>
      <p className="text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
        No credentials stored yet. Add your first password to start building your encrypted vault.
      </p>

      {/* Trust badges */}
      <div className="flex items-center gap-2 flex-wrap justify-center mb-8">
        {[
          { icon: Lock,      label: 'AES-256 encrypted' },
          { icon: EyeOff,    label: 'Zero-knowledge'    },
          { icon: HardDrive, label: 'Stored locally'    },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50">
            <Icon size={11} /> {label}
          </span>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all"
      >
        <Plus size={16} /> Add your first credential
      </button>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}