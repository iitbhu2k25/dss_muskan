// contexts/management/EmployeeContext/RegisterContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  supervisor: string;
  projectName: string;
}

interface RegisterContextType {
  register: (data: RegisterData) => Promise<{ success: boolean; userData?: any }>;
  isLoading: boolean;
  error: string;
  registeredUser: any | null;
}

const RegisterContext = createContext<RegisterContextType | undefined>(undefined);

export const useRegister = () => {
  const context = useContext(RegisterContext);
  if (!context) throw new Error('useRegister must be used within RegisterProvider');
  return context;
};

export const RegisterProvider = ({ children }: { children: ReactNode }) => {
  const [registeredUser, setRegisteredUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (data: RegisterData): string | null => {
    // Check required fields
    if (!data.username || !data.email || !data.password || !data.department || !data.supervisor || !data.projectName) {
      return 'Please fill in all required fields';
    }

    // Username validation (alphanumeric, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(data.username)) {
      return 'Username must be 3-20 characters (letters, numbers, underscore only)';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return 'Please enter a valid email address';
    }

    // Password validation
    if (data.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (data.password !== data.confirmPassword) {
      return 'Passwords do not match';
    }

    // Strong password check
    const hasUpperCase = /[A-Z]/.test(data.password);
    const hasLowerCase = /[a-z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Department validation
    if (data.department.trim().length < 2) {
      return 'Department name must be at least 2 characters long';
    }

    // Supervisor validation
    if (data.supervisor.trim().length < 2) {
      return 'Supervisor name must be at least 2 characters long';
    }

    // Project name validation
    if (data.projectName.trim().length < 2) {
      return 'Project name must be at least 2 characters long';
    }

    return null;
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; userData?: any }> => {
    setIsLoading(true);
    setError('');

    try {
      // Validate form data
      const validationError = validateForm(data);
      if (validationError) {
        setError(validationError);
        setIsLoading(false);
        return { success: false };
      }

      // Prepare registration data (exclude confirmPassword)
      const registrationData = {
        username: data.username.trim().toLowerCase(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        department: data.department.trim(),
        supervisor: data.supervisor.trim(),
        projectName: data.projectName.trim()
      };

      // Call your backend REGISTER API
      const response = await fetch('YOUR_BACKEND_URL/api/employee/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      const responseData = await response.json();

      // Check if registration was successful
      if (response.ok && responseData.success) {
        // Store the registered user data
        const userData = {
          ...responseData.user,
          token: responseData.token, // if backend returns token
          registeredAt: new Date().toISOString()
        };
        
        setRegisteredUser(userData);
        setError('');
        
        // Return user data for auto-login
        return { success: true, userData };
      } else {
        setError(responseData.message || 'Registration failed. Please try again.');
        return { success: false };
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again.');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegisterContext.Provider value={{ register, isLoading, error, registeredUser }}>
      {children}
    </RegisterContext.Provider>
  );
};