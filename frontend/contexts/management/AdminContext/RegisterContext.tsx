// contexts/management/AdminContext/RegisterContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

export interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  department: string;
  projects: string[];
}

interface RegisterContextType {
  register: (data: RegisterData) => Promise<boolean>;
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
    if (!data.name || !data.email || !data.username || !data.password || !data.department) {
      return 'Please fill in all required fields';
    }

    // Name validation (at least 2 characters)
    if (data.name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return 'Please enter a valid email address';
    }

    // Username validation (alphanumeric, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(data.username)) {
      return 'Username must be 3-20 characters (letters, numbers, underscore only)';
    }

    // Password validation
    if (data.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (data.password !== data.confirmPassword) {
      return 'Passwords do not match';
    }

    // Strong password check (optional but recommended)
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

    // Projects validation
    const validProjects = data.projects.filter(p => p.trim() !== '');
    if (validProjects.length === 0) {
      return 'Please add at least one project';
    }

    // Check for duplicate projects
    const uniqueProjects = new Set(validProjects.map(p => p.trim().toLowerCase()));
    if (uniqueProjects.size !== validProjects.length) {
      return 'Duplicate project names are not allowed';
    }

    return null;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError('');

    try {
      // Validate form data
      const validationError = validateForm(data);
      if (validationError) {
        setError(validationError);
        setIsLoading(false);
        return false;
      }

      // Filter and clean projects
      const cleanedProjects = data.projects
        .filter(p => p.trim() !== '')
        .map(p => p.trim());

      // Prepare registration data
      const registrationData = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        username: data.username.trim().toLowerCase(),
        password: data.password, // In real app, this should be hashed
        department: data.department.trim(),
        projects: cleanedProjects,
        registeredAt: new Date().toISOString()
      };

      // API call to dummy endpoint
      const response = await fetch('https://jsonplaceholder.typicode.com/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        const userData = await response.json();
        const newUser = {
          ...userData,
          ...registrationData,
          id: userData.id
        };
        setRegisteredUser(newUser);
        setError('');
        return true;
      } else {
        setError('Registration failed. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again.');
      return false;
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