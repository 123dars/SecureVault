import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import api from '../api';
import { encryptData, decryptData } from '../crypto';
import NoteCard from '../components/NoteCard';
import toast from 'react-hot-toast';
import {
  Search, ShieldAlert, LogOut, Plus, ShieldCheck
} from 'lucide-react';
const COLORS = [
  { name: 'slate',   bg: 'bg-slate-500' },
  { name: 'emerald', bg: 'bg-emerald-500' },
  { name: 'blue',    bg: 'bg-blue-500' },
  { name: 'purple',  bg: 'bg-purple-500' },
  { name: 'rose',    bg: 'bg-rose-500' },
  { name: 'amber',   bg: 'bg-amber-500' },
];
export default function Notes() {
  const { logout } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newForm, setNewForm] = useState({ title: '', content: '', color: 'slate' });
  const [sessionWarning, setSessionWarning] = useState(false);
  const masterPassword = sessionStorage.getItem('masterPassword');
  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get('/api/notes');
      const decryptedVault = res.data.map(item => ({
        ...item,
        content: decryptData(item.encrypted_content, item.iv, masterPassword)
      }));
      setNotes(decryptedVault);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading(false);
    }
  }, [masterPassword]);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => {
    const warnTimer = setTimeout(() => setSessionWarning(true),  13 * 60 * 1000);
    const lockTimer = setTimeout(() => logout(),                 15 * 60 * 1000);
    return () => { clearTimeout(warnTimer); clearTimeout(lockTimer); };
  }, [logout]);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!masterPassword) {
      toast.error("Security session expired! Please click 'Lock Vault' and log in again.", { style: { background: '#1e293b', color: '#fff' } });
      return;
    }
    
    if (newForm.content.trim().length === 0) {
      toast.error("Note content cannot be empty!", { style: { background: '#1e293b', color: '#fff' } });
      return;
    }
    try {
      const encryptResult = encryptData(newForm.content, masterPassword);
      
      await api.post('/api/notes', {
        title:             newForm.title,
        encrypted_content: encryptResult.ciphertext,
        iv:                encryptResult.iv,
        color:             newForm.color,
      });
      
      setNewForm({ title: '', content: '', color: 'slate' });
      fetchNotes();
      toast.success("Note securely encrypted & saved!", { icon: '🔐', style: { background: '#059669', color: '#fff' } });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save note.", { style: { background: '#1e293b', color: '#fff' } });
    }
  };
  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-white">Destroy this note?</span>
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.delete(`/api/notes/${id}`);
              setNotes(prev => prev.filter(n => n.id !== id));
              toast.success("Note destroyed!", { icon: '🗑️', style: { background: '#1e293b', color: '#fff' } });
            } catch {
              toast.error("Failed to delete note.", { style: { background: '#1e293b', color: '#fff' } });
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
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans selection:bg-emerald-500/30 pb-20 relative animate-in fade-in duration-300">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B0F19]/95 via-[#0B0F19]/90 to-emerald-950/40 pointer-events-none z-0" />
      {sessionWarning && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 backdrop-blur-sm text-black text-sm font-bold text-center py-2.5 px-4 flex items-center justify-center gap-3 shadow-lg">
          <ShieldAlert size={16} />
          Your vault will auto-lock in 2 minutes due to inactivity.
          <button onClick={() => { setSessionWarning(false); window.location.reload(); }} className="underline hover:no-underline ml-2">
            Stay logged in
          </button>
        </div>
      )}
      <nav className="sticky top-0 z-50 bg-[#111827]/80 backdrop-blur-xl border-b border-slate-800/60 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/50 border border-emerald-400/20">
                <ShieldCheck className="text-white drop-shadow-md" size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight leading-none">
                  SecureVault
                </h1>
                <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase mt-0.5">Zero-Knowledge</p>
              </div>
            </div>
            <div className="hidden md:flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
              <Link to="/vault" className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors">
                Passwords
              </Link>
              <Link to="/notes" className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30">
                Secure Notes
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20">
              <LogOut size={16} /> Lock Vault
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">Private Text Vault</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Encrypt and save your most sensitive text documents here. Bank routing numbers, secret keys, or private diaries—only you can read them.
          </p>
        </div>
        <div className="bg-[#111827]/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Plus className="text-emerald-400" size={16} />
            </div>
            <h3 className="text-xl font-bold text-white">Encrypt New Note</h3>
          </div>
          
          <form onSubmit={handleAdd} className="space-y-5">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Note Title (e.g., Bank Account Details)"
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-700/50 bg-[#0B0F19]/50 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  value={newForm.title}
                  onChange={e => setNewForm({ ...newForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-2 bg-[#0B0F19]/50 px-4 py-2 rounded-xl border border-slate-700/50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Color</span>
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setNewForm({ ...newForm, color: c.name })}
                    className={`w-6 h-6 rounded-full transition-all ${c.bg} ${newForm.color === c.name ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <textarea
                placeholder="Write your secret note here... It will be encrypted locally using AES-GCM before it ever leaves your device."
                rows="6"
                className="w-full px-5 py-4 rounded-xl border border-emerald-500/30 bg-[#0B0F19]/80 text-emerald-400 placeholder-emerald-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono text-sm resize-y"
                value={newForm.content}
                onChange={e => setNewForm({ ...newForm, content: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={newForm.content.trim().length === 0 || newForm.title.length === 0}
                className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Encrypt & Save Note
              </button>
            </div>
          </form>
        </div>
        <div className="mb-8 relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search decrypted notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-700/50 bg-[#111827]/80 backdrop-blur-md text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-lg"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(n => (
              <div key={n} className="h-64 bg-[#111827]/40 rounded-3xl border border-slate-800 animate-pulse" />
            ))
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map(n => (
              <NoteCard
                key={n.id}
                title={n.title}
                content={n.content}
                color={n.color}
                onCopy={(text) => {
                  navigator.clipboard.writeText(text);
                  toast.success("Note copied to clipboard", { icon: '📋', style: { background: '#1e293b', color: '#fff' } });
                }}
                onDelete={() => handleDelete(n.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-[#111827]/40 rounded-3xl border border-slate-800 border-dashed">
              <p className="text-slate-500 font-bold text-lg mb-2">No notes found.</p>
              <p className="text-slate-600 text-sm">Your private text vault is empty.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
