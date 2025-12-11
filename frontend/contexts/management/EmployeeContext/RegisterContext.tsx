// contexts/management/EmployeeContext/RegisterContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  supervisor_email: string;
  projectName: string;
  joining_date: string;      // ✅ NEW FIELD (YYYY-MM-DD)
  position: string;          // ✅ NEW FIELD
  resign_date?: string;      // ✅ NEW FIELD (optional)
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
  getSupervisorsByProject: (department: string, project: string) => string[];
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

  const [employersData, setEmployersData] = useState<EmployerData[]>([]);
  const [isLoadingEmployers, setIsLoadingEmployers] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchEmployersData();
  }, []);

  const fetchEmployersData = async () => {
    setIsLoadingEmployers(true);
    try {
      const response = await fetch('/django/management/admindata');
      const result = await response.json();

      if (result.success && result.data) {
        setEmployersData(result.data);
        const uniqueDepartments = [...new Set(result.data.map((emp: EmployerData) => emp.department))] as string[];
        setDepartments(uniqueDepartments);
      } else {
        setError('Failed to load departments data');
      }
    } catch (err) {
      setError('Error loading departments.');
    } finally {
      setIsLoadingEmployers(false);
    }
  };

  const getProjectsByDepartment = (department: string): string[] => {
    const departmentEmployers = employersData.filter(emp => emp.department === department);
    return [...new Set(departmentEmployers.flatMap(emp => emp.projects))];
  };

  const getSupervisorsByProject = (department: string, project: string): string[] => {
    const projectSupervisors = employersData.filter(
      emp => emp.department === department && emp.projects.includes(project)
    );
    return projectSupervisors.map(emp => emp.email);
  };

  const validateForm = (data: RegisterData): string | null => {
    if (
      !data.username ||
      !data.email ||
      !data.password ||
      !data.department ||
      !data.supervisor_email ||
      !data.projectName ||
      !data.joining_date ||    // ✅ NEW VALIDATION
      !data.position           // ✅ NEW VALIDATION
    ) {
      return 'Please fill in all required fields';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) return 'Invalid email';
    if (!emailRegex.test(data.supervisor_email)) return 'Invalid supervisor email';

    if (data.password.length < 6) return 'Password must be at least 6 characters';
    if (data.password !== data.confirmPassword) return 'Passwords do not match';

    // ✅ Validate joining_date is not in future
    const joiningDate = new Date(data.joining_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (joiningDate > today) {
      return 'Joining date cannot be in the future';
    }

    // ✅ Validate resign_date if provided
    if (data.resign_date) {
      const resignDate = new Date(data.resign_date);
      if (resignDate < joiningDate) {
        return 'Resign date cannot be before joining date';
      }
    }

    return null;
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError('');

    const validationError = validateForm(data);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return { success: false };
    }

    try {
      const payload = {
        name: data.username.toLowerCase(),
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        password: data.password,
        department: data.department,
        project_name: data.projectName,
        supervisor_email: data.supervisor_email,
        joining_date: data.joining_date,        // ✅ NEW FIELD
        position: data.position,                // ✅ NEW FIELD
        ...(data.resign_date && { resign_date: data.resign_date })  // ✅ Optional field
      };

      const response = await fetch('/django/management/register/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRegisteredUser(result.employee);
        return { success: true, userData: result };
      } else {
        setError(result.message || 'Registration failed');
        return { success: false };
      }
    } catch (error) {
      setError('Server error during registration');
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