// contexts/management/AdminContext/DashboardContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Employee {
  id: number;
  name: string;
  email: string;
  username: string;
  department: string;
  supervisor_name: string;
  supervisor_email: string | null;
  projectName: string;
  is_active: boolean;
}

export interface LeaveRecord {
  id: number;
  employee_name: string;
  employee_email: string;
  supervisor_email: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  leave_type: string;
  approval_status: string;
  created_at: string;
}

interface DashboardContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  filterByProjects: (projects: string[]) => Promise<void>;
  employeeLeaves: { [email: string]: LeaveRecord[] };
  leavesLoading: { [email: string]: boolean };
  fetchEmployeeLeaves: (email: string) => Promise<void>;
  approveLeave: (leaveId: number, status: 'approved' | 'rejected') => Promise<boolean>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeLeaves, setEmployeeLeaves] = useState<{ [email: string]: LeaveRecord[] }>({});
  const [leavesLoading, setLeavesLoading] = useState<{ [email: string]: boolean }>({});

  const filterByProjects = async (projects: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/django/management/filter-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const fetchEmployeeLeaves = async (email: string): Promise<void> => {
    setLeavesLoading(prev => ({ ...prev, [email]: true }));
    
    try {
      const token = localStorage.getItem('adminAuthToken');
      
      const response = await fetch('/django/management/leave-employee-email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ employee_email: email }),
      });

      const result = await response.json();

      if (response.ok) {
        setEmployeeLeaves(prev => ({
          ...prev,
          [email]: result.data || []
        }));
      }
    } catch (err) {
      console.error('Fetch employee leaves error:', err);
    } finally {
      setLeavesLoading(prev => ({ ...prev, [email]: false }));
    }
  };

  // ✅ SINGLE FUNCTION for both approve & reject
  const approveLeave = async (leaveId: number, status: 'approved' | 'rejected'): Promise<boolean> => {
    try {
      const token = localStorage.getItem('adminAuthToken');
      
      const response = await fetch('/django/management/leave-update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          leave_id: leaveId, 
          approval_status: status 
        }),
      });

      return response.ok;
    } catch (err) {
      console.error('Leave approval error:', err);
      return false;
    }
  };

  return (
    <DashboardContext.Provider value={{
      employees,
      loading,
      error,
      filterByProjects,
      employeeLeaves,
      leavesLoading,
      fetchEmployeeLeaves,
      approveLeave,  // ✅ Single function now
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used inside DashboardProvider');
  return context;
};
