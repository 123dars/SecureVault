import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import api from './api';
import { deriveKey } from './crypto'; 
import toast from 'react-hot-toast';

export const AuthContext = createContext();

// 1. Move constant outside the component to prevent dependency warnings
const AUTO_LOCK_TIME = 5 * 60 * 1000; // 5 minutes = 300,000 milliseconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(response => {
        // NEW CHECK: If they closed the tab, their masterPassword was wiped.
        // We MUST force them to log in again to get the decryption key.
        if (!sessionStorage.getItem('masterPassword')) {
          setUser(null);
          api.post('/auth/logout'); // Tell the backend to kill the cookie
        } else {
          setUser(response.data); 
        }
      })
      .catch(() => {
        setUser(null); 
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (masterPassword, userData) => {
    const strongKey = deriveKey(masterPassword, userData.username);
    sessionStorage.setItem('masterPassword', strongKey);
    setUser(userData);
  };

  // 2. Wrap logout in useCallback so it remains stable for the timer dependency
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      sessionStorage.removeItem('masterPassword');
      setUser(null);
    }
  }, []);

  // --- AUTO-LOCK LOGIC ---
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only run the timer if the user is actively logged in
    if (user) {
      timeoutRef.current = setTimeout(() => {
        toast('Vault locked due to inactivity.', { icon: '🔒', style: { background: '#1e293b', color: '#fff' } });
        logout();
      }, AUTO_LOCK_TIME);
    }
  }, [user, logout]); // 3. Added logout to the dependency array

  useEffect(() => {
    // Define what constitutes "activity"
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => resetTimer();

    // Attach listeners only if the user is logged in
    if (user) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetTimer(); // Start the timer immediately upon login
    }

    // Cleanup listeners when the component unmounts or user logs out
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, resetTimer]);
  // -----------------------

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
