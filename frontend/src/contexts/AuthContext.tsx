import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api, { authApi } from '../utils/api';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  plan?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

// ════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ════════════════════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ════════════════════════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ══════════════════════════════════════════════════════════════════════════
  // Initial Auth Check
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        setUser(response.user as User);
      } catch (error) {
        // Token ungültig - entfernen
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Login
  // ══════════════════════════════════════════════════════════════════════════

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login(email, password);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      setUser(response.user as User);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Register
  // ══════════════════════════════════════════════════════════════════════════

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    try {
      const response = await authApi.register(email, password, name);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      setUser(response.user as User);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Logout
  // ══════════════════════════════════════════════════════════════════════════

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    
    // Optional: Backend informieren
    authApi.logout().catch(() => {
      // Ignorieren - wir sind bereits ausgeloggt
    });
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Update Profile
  // ══════════════════════════════════════════════════════════════════════════

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const response = await api.put('/auth/profile', updates);
      setUser(prev => prev ? { ...prev, ...response.data.user } : null);
    } catch (error) {
      throw error;
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Context Value
  // ══════════════════════════════════════════════════════════════════════════

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
