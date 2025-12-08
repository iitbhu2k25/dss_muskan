




import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Mail, Lock, Building2, LogOut, Plus, X, Briefcase } from 'lucide-react';

// ============ CONTEXTS ============

// Login Context
interface LoginContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string;
}

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export const useLogin = () => {
  const context = useContext(LoginContext);
  if (!context) throw new Error('useLogin must be used within LoginProvider');
  return context;
};

export const LoginProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return false;
      }

      const response = await fetch('https://jsonplaceholder.typicode.com/users/1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const authenticatedUser = {
          ...userData,
          email,
          loggedInAt: new Date().toISOString()
        };
        setUser(authenticatedUser);
        setError('');
        return true;
      } else {
        setError('Invalid credentials. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError('');
  };

  return (
    <LoginContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </LoginContext.Provider>
  );
};