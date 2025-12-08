// contexts/management/EmployeeContext/LoginContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface LoginContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithUserData: (userData: any) => void;
  logout: () => Promise<void>;
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
      // Validate inputs
      if (!email || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return false;
      }

      // Call your backend LOGIN API
      const response = await fetch('YOUR_BACKEND_URL/api/employee/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();

      // Check if login was successful
      if (response.ok && data.success) {
        // Store user data from backend
        const userData = {
          ...data.user,
          token: data.token, // if you use JWT tokens
          loggedInAt: new Date().toISOString()
        };
        
        setUser(userData);
        setError('');
        
        // Optionally store token in localStorage for persistence
        if (data.token) {
          localStorage.setItem('employeeAuthToken', data.token);
        }
        
        return true;
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
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

  // Direct login with user data (used after registration)
  const loginWithUserData = (userData: any) => {
    setUser(userData);
    setError('');
    
    // Optionally store token if provided
    if (userData.token) {
      localStorage.setItem('employeeAuthToken', userData.token);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Call your backend LOGOUT API
      const token = localStorage.getItem('employeeAuthToken');
      
      await fetch('YOUR_BACKEND_URL/api/employee/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // if you use JWT
        }
      });
      
      // Clear user data and token
      setUser(null);
      setError('');
      localStorage.removeItem('employeeAuthToken');
      
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local data even if API fails
      setUser(null);
      setError('');
      localStorage.removeItem('employeeAuthToken');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContext.Provider value={{ user, login, loginWithUserData, logout, isLoading, error }}>
      {children}
    </LoginContext.Provider>
  );
};