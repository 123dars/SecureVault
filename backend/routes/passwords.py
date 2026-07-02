import bleach
import base64
from flask import Blueprint, request, jsonify
from database import db, Password, User, PasswordHistory
from flask_jwt_extended import jwt_required, get_jwt_identity
passwords_bp = Blueprint('passwords', __name__)
@passwords_bp.route('', strict_slashes=False, methods=['POST'])
@jwt_required()
def add_password():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    ciphertext = data.get('encrypted_password')
    iv = data.get('iv')
    
    if not data or not data.get('site_name') or not ciphertext or not iv:
        return jsonify({"error": "Missing site_name, ciphertext, or iv"}), 400
        
    try:
        binary_ciphertext = base64.b64decode(ciphertext)
        binary_iv = base64.b64decode(iv)
        
        totp_secret_b64 = data.get('encrypted_totp_secret')
        totp_iv_b64 = data.get('totp_iv')
        
        binary_totp_secret = base64.b64decode(totp_secret_b64) if totp_secret_b64 else None
        binary_totp_iv = base64.b64decode(totp_iv_b64) if totp_iv_b64 else None
        safe_site_name = bleach.clean(data['site_name'])
        safe_username = bleach.clean(data.get('username', ''))
        
        new_pwd = Password(
            user_id=current_user_id,
            site_name=safe_site_name,
            username=safe_username,
            encrypted_password=binary_ciphertext,
            iv=binary_iv,
            encrypted_totp_secret=binary_totp_secret,
            totp_iv=binary_totp_iv,
            category=data.get('category', 'General')
        )
        
        db.session.add(new_pwd)
        db.session.commit()
        return jsonify({"message": "Password saved successfully", "id": new_pwd.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@passwords_bp.route('', strict_slashes=False, methods=['GET'])
@jwt_required()
def get_passwords():
    current_user_id = get_jwt_identity()
    passwords = Password.query.filter_by(user_id=current_user_id).all()
    
    vault = []
    for p in passwords:
        item = {
            "id": p.id,
            "site_name": p.site_name,
            "username": p.username,
            "encrypted_password": base64.b64encode(p.encrypted_password).decode('utf-8'),
            "iv": base64.b64encode(p.iv).decode('utf-8'),
            "category": p.category,
            "created_at": p.created_at.isoformat()
        }
        
        if p.encrypted_totp_secret and p.totp_iv:
            item["encrypted_totp_secret"] = base64.b64encode(p.encrypted_totp_secret).decode('utf-8')
            item["totp_iv"] = base64.b64encode(p.totp_iv).decode('utf-8')
            
        vault.append(item)
        
    return jsonify(vault), 200
@passwords_bp.route('/<int:pwd_id>', methods=['DELETE'])
@jwt_required()
def delete_password(pwd_id):
    current_user_id = get_jwt_identity()
    pwd = Password.query.filter_by(id=pwd_id, user_id=current_user_id).first()
    
    if not pwd:
        return jsonify({"error": "Password not found"}), 404
        
    db.session.delete(pwd)
    db.session.commit()
    return jsonify({"message": "Password deleted"}), 200
@passwords_bp.route('/<int:pwd_id>', methods=['PUT'])
@jwt_required()
def update_password(pwd_id):
    current_user_id = get_jwt_identity()
    pwd = Password.query.filter_by(id=pwd_id, user_id=current_user_id).first()
    
    if not pwd:
        return jsonify({"error": "Password not found"}), 404
        
    data = request.get_json()
    new_ciphertext = data.get('encrypted_password')
    new_iv = data.get('iv')
    
    if not data or not new_ciphertext or not new_iv:
        return jsonify({"error": "Missing encrypted_password or iv"}), 400
        
    try:
        # 1. Save current password to history
        history_entry = PasswordHistory(
            password_id=pwd.id,
            encrypted_password=pwd.encrypted_password,
            iv=pwd.iv,
            created_at=pwd.created_at
        )
        db.session.add(history_entry)
        
        # 2. Update the password
        pwd.encrypted_password = base64.b64decode(new_ciphertext)
        pwd.iv = base64.b64decode(new_iv)
        
        if 'site_name' in data:
            pwd.site_name = bleach.clean(data['site_name'])
        if 'username' in data:
            pwd.username = bleach.clean(data['username'])
        if 'category' in data:
            pwd.category = data['category']
            
        import datetime
        pwd.created_at = datetime.datetime.utcnow()
            
        db.session.commit()
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@passwords_bp.route('/<int:pwd_id>/history', methods=['GET'])
@jwt_required()
def get_password_history(pwd_id):
    current_user_id = get_jwt_identity()
    
    # Ensure the user owns this password
    pwd = Password.query.filter_by(id=pwd_id, user_id=current_user_id).first()
    if not pwd:
        return jsonify({"error": "Password not found"}), 404
        
    history = PasswordHistory.query.filter_by(password_id=pwd_id).order_by(PasswordHistory.created_at.desc()).all()
    
    result = []
    for h in history:
        result.append({
            "id": h.id,
            "encrypted_password": base64.b64encode(h.encrypted_password).decode('utf-8'),
            "iv": base64.b64encode(h.iv).decode('utf-8'),
            "created_at": h.created_at.isoformat()
        })
        
    return jsonify(result), 200
3. Frontend: PasswordCard.js (Replaces frontend/src/components/PasswordCard.js)
javascript


import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Check, Edit2, History, Trash2, X, Save } from 'lucide-react';
import { encryptData, decryptData } from '../crypto';
import api from '../api';
import toast from 'react-hot-toast';
const COLOR_STYLES = {
  General:  { bg: 'bg-slate-500/10',   text: 'text-slate-600 dark:text-slate-400',   border: 'border-slate-500/20'   },
  Work:     { bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-500/20'    },
  Finance:  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  Social:   { bg: 'bg-indigo-500/10',  text: 'text-indigo-600 dark:text-indigo-400',  border: 'border-indigo-500/20'  },
  Gaming:   { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    border: 'border-rose-500/20'    },
  Shopping: { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-500/20'   },
};
export default function PasswordCard({ id, site_name, username, password, category, onUpdate, onCopy, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editSiteName, setEditSiteName] = useState(site_name);
  const [editUsername, setEditUsername] = useState(username);
  const [editPassword, setEditPassword] = useState(password);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const style = COLOR_STYLES[category] || COLOR_STYLES.General;
  const masterPassword = sessionStorage.getItem('masterPassword');
  const handleCopy = () => {
    onCopy(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleSaveEdit = async () => {
    if (!editPassword) {
      toast.error("Password cannot be empty.");
      return;
    }
    try {
      const pwdEncrypt = await encryptData(editPassword, masterPassword);
      await api.put(`/passwords/${id}`, {
        site_name: editSiteName,
        username: editUsername,
        encrypted_password: pwdEncrypt.ciphertext,
        iv: pwdEncrypt.iv,
        category: category
      });
      setIsEditing(false);
      toast.success("Credential updated! Old password saved to history.", { icon: '🔐' });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update credential.");
    }
  };
  const fetchHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setLoadingHistory(true);
    setShowHistory(true);
    try {
      const res = await api.get(`/passwords/${id}/history`);
      const decryptedHistory = await Promise.all(res.data.map(async item => {
        let decPwd = "ERROR";
        try {
          decPwd = await decryptData(item.encrypted_password, item.iv, masterPassword);
        } catch(e) {}
        return { ...item, decrypted_password: decPwd };
      }));
      setHistoryItems(decryptedHistory);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load history.");
    } finally {
      setLoadingHistory(false);
    }
  };
  return (
    <div className={`group relative bg-white dark:bg-[#18181b] backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 flex flex-col h-full hover:border-indigo-500/30 dark:hover:border-indigo-500/50 hover:shadow-indigo-500/5`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.text.split(' ')[0].replace('text', 'bg')}`} />
          {category}
        </span>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button onClick={fetchHistory} className={`p-1.5 rounded-lg transition-colors ${showHistory ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#27272a]'}`} title="Password History">
                <History size={16} />
              </button>
              <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#27272a] transition-colors" title="Edit">
                <Edit2 size={16} />
              </button>
            </>
          )}
          {isEditing && (
            <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Cancel">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      {/* BODY */}
      {isEditing ? (
        <div className="flex-grow space-y-3 mb-5">
          <input
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            value={editSiteName} onChange={(e) => setEditSiteName(e.target.value)} placeholder="Site Name"
          />
          <input
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] text-slate-600 dark:text-slate-400 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Username"
          />
          <input
            className="w-full p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/50 bg-indigo-50 dark:bg-[#09090b] text-indigo-600 dark:text-indigo-400 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="New Password" type="text"
          />
          <button onClick={handleSaveEdit} className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors mt-2">
            <Save size={16} /> Save Changes
          </button>
        </div>
      ) : (
        <>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate mb-1">{site_name}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate mb-5">{username || 'No username'}</p>
          <div className="bg-slate-50 dark:bg-[#09090b] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between flex-grow mb-5">
            <span className={`font-mono tracking-wider text-sm truncate mr-4 ${showPassword ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 mt-1.5'}`}>
              {showPassword ? password : '••••••••••••'}
            </span>
          </div>
        </>
      )}
      {/* HISTORY DROPDOWN */}
      {showHistory && !isEditing && (
        <div className="mb-5 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 max-h-48 overflow-y-auto custom-scrollbar">
          <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <History size={12} /> Password History
          </h4>
          {loadingHistory ? (
             <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">Loading...</div>
          ) : historyItems.length === 0 ? (
             <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">No previous passwords found.</div>
          ) : (
            <div className="space-y-2">
              {historyItems.map((hi, idx) => (
                <div key={hi.id} className="flex justify-between items-center p-2 bg-white dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">{hi.decrypted_password}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{new Date(hi.created_at).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(hi.decrypted_password); toast.success("Old password copied!"); }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-50 dark:bg-[#09090b] rounded-lg"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ACTIONS */}
      {!isEditing && (
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all duration-300 ${
              showPassword 
                ? 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-[#27272a] dark:border-slate-700 dark:text-slate-300' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500/20'
            }`}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPassword ? 'Hide' : 'Reveal'}
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all duration-300 ${
              copied
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 scale-[0.98]'
                : 'bg-white border-slate-200 text-slate-600 dark:bg-[#18181b] dark:border-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30'
            }`}
          >
            {copied ? <Check size={16} className="animate-bounce-once" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181b] text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all duration-200"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
