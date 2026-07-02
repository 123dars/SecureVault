import React, { useState } from 'react';
import { Copy, Trash2, Eye, EyeOff, Check, AlignLeft } from 'lucide-react';
const COLOR_STYLES = {
  slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-600 dark:text-slate-400',   border: 'border-slate-500/20'   },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20'    },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20'  },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20'    },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
};
export default function NoteCard({ title, content, color = 'slate', onCopy, onDelete }) {
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const style = COLOR_STYLES[color] || COLOR_STYLES.slate;
  const handleCopy = () => {
    onCopy?.(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className={`group relative bg-white dark:bg-[#111827]/60 backdrop-blur-md p-5 rounded-3xl border shadow-xl transition-all duration-300 flex flex-col border-slate-200 dark:border-slate-700/50 hover:border-slate-600/60 h-full`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
          <AlignLeft size={10} /> Secure Note
        </span>
      </div>
      <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
      <div className={`relative bg-slate-50 dark:bg-[#0B0F19]/70 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex-grow mb-4 flex flex-col transition-all duration-300`}>
        {showContent ? (
          <div className="text-sm text-emerald-400 whitespace-pre-wrap font-mono overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2">
            {content}
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center py-4">
            <span className="text-sm font-mono text-slate-500 dark:text-slate-500 tracking-[0.3em] uppercase">
              • Encrypted •
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-auto">
        <button
          onClick={() => setShowContent(!showContent)}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
            showContent 
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-700' 
              : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600 hover:text-slate-900 dark:text-white'
          }`}
        >
          {showContent ? <EyeOff size={15} /> : <Eye size={15} />}
          {showContent ? 'Hide' : 'Reveal'}
        </button>
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200
            ${copied
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 scale-[0.98]'
              : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-700 hover:text-slate-900 dark:text-white'}`}
        >
          {copied ? <Check size={15} className="animate-bounce-once" /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-slate-900 dark:text-white hover:border-rose-500 transition-all duration-200"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
