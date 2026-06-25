import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; 
import api from '../api';
import toast from 'react-hot-toast';
import { ShieldCheck, Key } from 'lucide-react';

export default function MfaSetup() {
  const navigate = useNavigate();
  
  const [setupData, setSetupData] = useState({ secret: '', uri: '' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch the Secret and URI from your backend when the page loads
  useEffect(() => {
    const fetchMfaData = async () => {
      try {
        const response = await api.post('/api/mfa/setup');
        setSetupData({
          secret: response.data.secret,
          uri: response.data.uri
        });
      } catch (err) {
        setError(err.response?.data?.error || "Failed to initialize MFA setup.");
      } finally {
        setLoading(false);
      }
    };

    fetchMfaData();
  }, []);

  // 2. Submit the 6-digit code to your /enable route
  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    try {
      await api.post('/api/mfa/enable', { code: code });
      toast.success("Multi-Factor Authentication enabled!");
      
      // Redirect to the vault after successful setup
      navigate('/vault');
    } catch (err) {
      setError(err.response?.data?.error || "Invalid verification code. Try again.");
      setCode(''); // Clear the input so they can type again
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading secure setup...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
        
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full">
            <ShieldCheck className="text-blue-600" size={32} />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Secure Your Vault</h2>
          <p className="text-slate-500 text-sm mt-2">Setup Two-Factor Authentication (2FA)</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center space-y-6">
          <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm">
            {setupData.uri ? (
              <QRCodeSVG value={setupData.uri} size={200} level="H" />
            ) : (
              <div className="w-[200px] h-[200px] bg-slate-100 animate-pulse rounded-lg"></div>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Scan this QR code with <b>Google Authenticator</b> or <b>Authy</b>.</p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 py-2 px-4 rounded-lg">
              <Key size={14} />
              <span>Manual Key: <b className="tracking-widest text-slate-700 font-mono">{setupData.secret}</b></span>
            </div>
          </div>

          <form onSubmit={handleVerify} className="w-full space-y-4 pt-4 border-t border-slate-100">
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              value={code} 
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
              required 
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest font-mono transition-all"
            />
            <button 
              type="submit" 
              disabled={verifying || code.length !== 6} 
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}