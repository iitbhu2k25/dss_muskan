// contexts/management/EmployeeContext/LeaveContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLogin } from './LoginContext';

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

export interface LeaveRequestData {
  employee_name: string;
  employee_email: string;
  supervisor_email: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  leave_type: string;
}

interface LeaveContextType {
  isSubmitting: boolean;
  error: string;
  successMessage: string;
  createLeaveRequest: (data: Omit<LeaveRequestData, 'is_approved'>) => Promise<boolean>;
  leaves: LeaveRecord[];
  totalLeaves: number;
  loadingLeaves: boolean;
  fetchLeaves: () => Promise<void>;
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
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [totalLeaves, setTotalLeaves] = useState(0);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const fetchLeaves = async (): Promise<void> => {
    if (!user?.email) return;

    setLoadingLeaves(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeAuthToken');
      
      // ✅ POST request with employee_email (matches your backend)
      const response = await fetch('/django/management/leave-employee-email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          employee_email: user.email  // ✅ Required by your backend
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setLeaves(result.data || []);
        setTotalLeaves(result.total_leaves || 0);
      } else {
        setError(result.message || 'Failed to fetch leave records');
      }
    } catch (err) {
      console.error('Fetch leaves error:', err);
      setError('Server error while fetching leave records');
    } finally {
      setLoadingLeaves(false);
    }
  };

  // Auto-fetch leaves when user changes
  useEffect(() => {
    if (user?.email) {
      fetchLeaves();
    }
  }, [user?.email]);

  const createLeaveRequest = async (data: Omit<LeaveRequestData, 'is_approved'>): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to apply for leave');
      return false;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        employee_name: data.employee_name,
        employee_email: data.employee_email,
        supervisor_email: data.supervisor_email,
        from_date: data.from_date,
        to_date: data.to_date,
        total_days: data.total_days,
        reason: data.reason,
        leave_type: data.leave_type,
      };

      const token = localStorage.getItem('employeeAuthToken');

      const response = await fetch('/django/management/apply-leave/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(result.message || 'Leave request submitted successfully');
        // ✅ Refresh leaves list after successful submission
        await fetchLeaves();
        return true;
      } else {
        setError(result.error || 'Failed to submit leave request');
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
        leaves,
        totalLeaves,
        loadingLeaves,
        fetchLeaves,
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
};
