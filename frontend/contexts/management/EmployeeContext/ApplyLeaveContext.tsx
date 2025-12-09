// contexts/management/EmployeeContext/LeaveContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { useLogin } from './LoginContext';

export interface LeaveRequestData {
  employee_name: string;
  employee_email: string;
  supervisor_name: string | null;
  supervisor_email: string | null;
  start_date: string;     // ISO date string yyyy-mm-dd
  end_date: string;       // ISO date string yyyy-mm-dd
  total_days: number;
  remarks: string;
  is_approved: boolean;   // will be false when creating
}

interface LeaveContextType {
  isSubmitting: boolean;
  error: string;
  successMessage: string;
  createLeaveRequest: (data: Omit<LeaveRequestData, 'is_approved'>) => Promise<boolean>;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const useLeave = () => {
  const ctx = useContext(LeaveContext);
  if (!ctx) throw new Error('useLeave must be used within LeaveProvider');
  return ctx;
};

export const LeaveProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useLogin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const createLeaveRequest = async (
    data: Omit<LeaveRequestData, 'is_approved'>
  ): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to apply for leave');
      return false;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload: LeaveRequestData = {
        ...data,
        is_approved: false, // ✅ always false on create
      };

      const token = localStorage.getItem('employeeAuthToken');

      const response = await fetch('/django/management/leave/employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(result.message || 'Leave request submitted');
        return true;
      } else {
        setError(result.message || 'Failed to submit leave request');
        return false;
      }
    } catch (err) {
      console.error('Leave submit error:', err);
      setError('Server error while submitting leave request');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LeaveContext.Provider
      value={{
        isSubmitting,
        error,
        successMessage,
        createLeaveRequest,
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
};
