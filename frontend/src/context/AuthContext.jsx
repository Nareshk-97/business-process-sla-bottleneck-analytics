import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sla_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sla_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.getProfile()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('sla_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.success && res.data) {
      const { user: userData, access_token } = res.data;
      setUser(userData);
      setToken(access_token);
      localStorage.setItem('sla_token', access_token);
      localStorage.setItem('sla_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    if (res.success && res.data) {
      const { user: userData, access_token } = res.data;
      setUser(userData);
      setToken(access_token);
      localStorage.setItem('sla_token', access_token);
      localStorage.setItem('sla_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sla_token');
    localStorage.removeItem('sla_user');
  };

  // Quick 1-click login for demonstration/testing
  const quickLogin = async (roleType) => {
    const accounts = {
      ADMIN: { email: 'admin@enterprise.com', password: 'Password@123' },
      MANAGER: { email: 'hr.manager@enterprise.com', password: 'Password@123' },
      EMPLOYEE: { email: 'john.hr@enterprise.com', password: 'Password@123' }
    };
    const creds = accounts[roleType] || accounts.ADMIN;
    return login(creds.email, creds.password);
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    quickLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
