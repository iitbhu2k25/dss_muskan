import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Employee {
  id: number;
  name: string;
  displayName: string;
  email: string;
  username: string;
  department: string;
  supervisor: string;
  projectName: string;
  is_active: boolean;
}

interface DashboardContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  filterByProjects: (projects: string[]) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);



export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterByProjects = async (projects: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/django/management/filter-employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projects }),
      });

      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees);
      } else {
        setError(data.message || 'Failed to filter employees');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Filter error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        employees,
        loading,
        error,
        filterByProjects,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};