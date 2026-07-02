import React, { useState } from 'react';
import { Copy, Trash2, Eye, EyeOff, Check, AlignLeft } from 'lucide-react';

const COLOR_STYLES = {
  slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-600 dark:text-slate-400',   border: 'border-slate-500/20'   },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-500/20'    },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400',  border: 'border-purple-500/20'  },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    border: 'border-rose-500/20'    },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-500/20'   },
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
    <div className={`group relative bg-white dark:bg-[#09090b]/80 backdrop-blur-xl p-6 rounded-3xl border shadow-xl transition-all duration-300 flex flex-col border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 hover:shadow-indigo-500/5 h-full`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
          <AlignLeft size={10} /> Secure Note
        </span>
      </div>

      <h3 className="mb-5 text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>

      <div className={`relative bg-slate-50 dark:bg-[#18181b] px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-grow mb-5 flex flex-col transition-all duration-300`}>
        {showContent ? (
          <div className="text-sm text-indigo-600 dark:text-indigo-400 whitespace-pre-wrap font-mono overflow-y-auto max-h-48 custom-scrollbar pr-2 leading-relaxed">
            {content}
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center py-6">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tracking-[0.3em] uppercase font-bold">
              • Encrypted •
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto">
        <button
          onClick={() => setShowContent(!showContent)}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all duration-300 ${
            showContent 
              ? 'bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#18181b]' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500/20'
          }`}
        >
          {showContent ? <EyeOff size={16} /> : <Eye size={16} />}
          {showContent ? 'Hide' : 'Reveal'}
        </button>

        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all duration-300
            ${copied
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 scale-[0.98]'
              : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 shadow-sm'}`}
        >
          {copied ? <Check size={16} className="animate-bounce-once" /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy'}
        </button>

        <button
          onClick={onDelete}
          className="flex items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18181b] text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm transition-all duration-200"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
