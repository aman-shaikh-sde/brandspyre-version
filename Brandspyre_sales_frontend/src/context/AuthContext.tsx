import React, { createContext, useContext, useState, useEffect } from 'react';
import { BuyerUser } from '../types';
import api from '../services/api';

interface AuthContextType {
  buyer: BuyerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string, company_name?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<BuyerUser>) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [buyer, setBuyer] = useState<BuyerUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('buyer_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.buyer) {
          setBuyer(res.data.buyer);
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success && res.data.token) {
      localStorage.setItem('buyer_token', res.data.token);
      setToken(res.data.token);
      setBuyer(res.data.buyer);
      setIsAuthModalOpen(false);
    } else {
      throw new Error(res.data?.error || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, phone: string, company_name?: string) => {
    const res = await api.post('/auth/register', { name, email, password, phone, company_name });
    if (res.data?.success && res.data.token) {
      localStorage.setItem('buyer_token', res.data.token);
      setToken(res.data.token);
      setBuyer(res.data.buyer);
      setIsAuthModalOpen(false);
    } else {
      throw new Error(res.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('buyer_token');
    setToken(null);
    setBuyer(null);
  };

  const updateProfile = async (data: Partial<BuyerUser>) => {
    const res = await api.put('/auth/profile', data);
    if (res.data?.success && res.data.buyer) {
      setBuyer(res.data.buyer);
    } else {
      throw new Error(res.data?.error || 'Profile update failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        buyer,
        token,
        isAuthenticated: !!buyer,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
