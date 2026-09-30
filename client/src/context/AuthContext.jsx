import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('rxguard_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rxguard_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [highContrast, setHighContrast] = useState(false);
  const [phiMasked, setPhiMasked] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [notification, setNotification] = useState(null);

  // Validate active token on initial load
  useEffect(() => {
    if (token) {
      api.getMe()
        .then(res => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('rxguard_user', JSON.stringify(res.user));
          } else {
            logout();
          }
        })
        .catch(() => {
          // Keep offline state if server temporarily unavailable
        });
    }
  }, [token]);

  // High contrast body class toggle (UQR2)
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Session Inactivity Auto-Lock (SQR2: 10 minutes)
  useEffect(() => {
    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!isLocked && user) {
        timeoutId = setTimeout(() => {
          setIsLocked(true);
        }, 10 * 60 * 1000); // 10 minutes
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [isLocked, user]);

  const login = async (username, password) => {
    try {
      const res = await api.login(username, password);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('rxguard_token', res.token);
        localStorage.setItem('rxguard_user', JSON.stringify(res.user));
        showNotification(`Authenticated successfully as ${res.user.fullName} (${res.user.role})`, 'success');
        return { success: true, user: res.user };
      } else {
        showNotification(res.error || 'Authentication failed. Please verify credentials.', 'error');
        return { success: false, error: res.error };
      }
    } catch (e) {
      showNotification('Network connection error during sign in', 'error');
      return { success: false, error: e.message };
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('rxguard_token');
    localStorage.removeItem('rxguard_user');
    showNotification('Session closed. Select professional role to log in.', 'info');
  };

  const unlockWorkstation = (password) => {
    if (password === 'password123' || password === '1234') {
      setIsLocked(false);
      showNotification('Workstation unlocked', 'success');
      return true;
    }
    return false;
  };

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      highContrast,
      setHighContrast,
      phiMasked,
      setPhiMasked,
      isLocked,
      setIsLocked,
      unlockWorkstation,
      notification,
      showNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
