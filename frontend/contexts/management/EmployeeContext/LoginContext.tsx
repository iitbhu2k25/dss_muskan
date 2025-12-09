// contexts/management/EmployeeContext/LoginContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  department: string;
  supervisor: string;
  projectName: string;
  is_active: boolean;
  last_login?: string;
  token?: string;
}

interface LoginContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithUserData: (userData: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string;
  checkAuthStatus: () => Promise<boolean>;
}

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export const useLogin = () => {
  const context = useContext(LoginContext);
  if (!context) throw new Error('useLogin must be used within LoginProvider');
  return context;
};

export const LoginProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkAuthStatus();
      setIsCheckingAuth(false);
    };
    initAuth();
  }, []);

  const checkAuthStatus = async (): Promise<boolean> => {
    const token = localStorage.getItem('employeeAuthToken');
    
    if (!token) {
      setUser(null);
      return false;
    }

    try {
      const response = await fetch('/django/management/status/employee', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success && data.is_active) {
        // User is still logged in and active, set full user data
        const userData: User = {
          ...data.user,
          token: token
        };
        setUser(userData);
        return true;
      } else {
        // Token invalid or user inactive
        localStorage.removeItem('employeeAuthToken');
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('employeeAuthToken');
      setUser(null);
      return false;
    }
  };

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

      // Call backend LOGIN API
      const response = await fetch('/django/management/login/employee', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password 
        })
      });
      
      const data = await response.json();

      // Check if login was successful
      if (response.ok && data.success) {
        // Store user data from backend
        const userData: User = {
          ...data.user,
          token: data.token,
        };
        
        setUser(userData);
        setError('');
        
        // Store token in localStorage for persistence
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
  const loginWithUserData = (userData: User) => {
    setUser(userData);
    setError('');
    
    // Store token if provided
    if (userData.token) {
      localStorage.setItem('employeeAuthToken', userData.token);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('employeeAuthToken');
      
      if (token) {
        // Call backend LOGOUT API
        const response = await fetch('/django/management/logout/employee', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Logout API error:', data.message);
        }
      }
      
      // Clear user data and token (even if API fails)
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

  // Show loading state while checking initial auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="inline-block">
            <svg className="animate-spin h-12 w-12 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LoginContext.Provider 
      value={{ 
        user, 
        login, 
        loginWithUserData, 
        logout, 
        isLoading, 
        error,
        checkAuthStatus 
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};