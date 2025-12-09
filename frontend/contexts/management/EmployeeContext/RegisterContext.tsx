// contexts/management/EmployeeContext/RegisterContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  supervisor: string; // Now this will be EMAIL
  projectName: string;
}

export interface EmployerData {
  id: number;
  name: string;
  email: string;
  username: string;
  department: string;
  projects: string[];
  created_at: string;
  is_active: boolean;
}

interface RegisterContextType {
  register: (data: RegisterData) => Promise<{ success: boolean; userData?: any }>;
  isLoading: boolean;
  error: string;
  registeredUser: any | null;
  employersData: EmployerData[];
  isLoadingEmployers: boolean;
  departments: string[];
  getProjectsByDepartment: (department: string) => string[];
  getSupervisorsByProject: (department: string, project: string) => string[]; // Returns EMAILS
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

  // Employers data states
  const [employersData, setEmployersData] = useState<EmployerData[]>([]);
  const [isLoadingEmployers, setIsLoadingEmployers] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch employers data on mount
  useEffect(() => {
    fetchEmployersData();
  }, []);

  const fetchEmployersData = async () => {
    setIsLoadingEmployers(true);
    try {
      const response = await fetch('/django/management/admindata', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        setEmployersData(result.data);

        // Extract unique departments
        const uniqueDepartments = [...new Set(result.data.map((emp: EmployerData) => emp.department))] as string[];
        setDepartments(uniqueDepartments);
      } else {
        setError('Failed to load departments data');
      }
    } catch (err) {
      console.error('Error fetching employers:', err);
      setError('Error loading departments. Please refresh the page.');
    } finally {
      setIsLoadingEmployers(false);
    }
  };

  // Get projects by department
  const getProjectsByDepartment = (department: string): string[] => {
    if (!department) return [];

    const departmentEmployers = employersData.filter(
      emp => emp.department === department
    );

    const allProjects = departmentEmployers.flatMap(emp => emp.projects);
    const uniqueProjects = [...new Set(allProjects)];

    return uniqueProjects;
  };

  // Get SUPERVISOR EMAILS by project and department
  const getSupervisorsByProject = (department: string, project: string): string[] => {
    if (!department || !project) return [];

    const projectSupervisors = employersData.filter(
      emp => emp.department === department && emp.projects.includes(project)
    );

    // RETURN EMAILS instead of usernames
    const supervisorEmails = projectSupervisors.map(emp => emp.email);
    return supervisorEmails;
  };

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

    // Supervisor EMAIL validation
    if (!emailRegex.test(data.supervisor)) {
      return 'Please select a valid supervisor email';
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

      // Prepare registration data - supervisor is now EMAIL
      const registrationData = {
        name: data.username.trim().toLowerCase(),
        username: data.username.trim().toLowerCase(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        department: data.department.trim(),
        supervisor_email: data.supervisor.trim(), // SEND AS supervisor_email
        supervisor: data.supervisor.trim(), // Keep for backward compatibility if needed
        project_name: data.projectName.trim()
      };

      // Call your backend REGISTER API
      const response = await fetch('/django/management/register/employee', {
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
          ...responseData.employee,
          token: responseData.token,
          registeredAt: new Date().toISOString()
        };

        setRegisteredUser(userData);
        setError('');

        // Return user data for auto-login
        return { success: true, userData };
      } else {
        // Handle error
        if (responseData.message) {
          setError(responseData.message);
        } else if (typeof responseData === 'object') {
          const errorMessages = Object.entries(responseData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          setError(errorMessages || 'Registration failed. Please try again.');
        } else {
          setError('Registration failed. Please try again.');
        }
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
    <RegisterContext.Provider
      value={{
        register,
        isLoading,
        error,
        registeredUser,
        employersData,
        isLoadingEmployers,
        departments,
        getProjectsByDepartment,
        getSupervisorsByProject
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
};
