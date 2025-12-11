// components/management/employee/components/leave.tsx
'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { Calendar, FileText, User, Mail, UserCheck, X, Send, Briefcase, CalendarDays } from 'lucide-react';
import { useLogin } from '@/contexts/management/EmployeeContext/LoginContext';
import { useLeave } from '@/contexts/management/EmployeeContext/ApplyLeaveContext';

interface LeaveRequestFormProps {
  onClose?: () => void;
}

export default function LeaveRequestForm({ onClose }: LeaveRequestFormProps) {
  const { user } = useLogin();
  const { createLeaveRequest, isSubmitting, error, successMessage } = useLeave();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [reason, setReason] = useState('');      // ✅ Backend: reason
  const [leaveType, setLeaveType] = useState(''); // ✅ Backend: leave_type
  const [localError, setLocalError] = useState('');

  const displayError = error || localError;

  // Auto-calc days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        setTotalDays(0);
        return;
      }
      const diffMs = end.getTime() - start.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // inclusive
      setTotalDays(days);
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate]);

  if (!user) {
    return null;
  }

  const handleSubmit = async () => {
    setLocalError('');

    if (!startDate || !endDate || !reason.trim() || !leaveType.trim()) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (totalDays <= 0) {
      setLocalError('End date must be on or after start date');
      return;
    }

    if (!user.supervisor_email) {
      setLocalError('No supervisor email assigned');
      return;
    }

    // ✅ Backend expects these exact field names
    const success = await createLeaveRequest({
      employee_name: user.name || user.username,
      employee_email: user.email,
      supervisor_email: user.supervisor_email,  // ✅ Backend field
      from_date: startDate,                     // ✅ Backend field
      to_date: endDate,                         // ✅ Backend field
      total_days: totalDays,                    // ✅ Backend field
      reason: reason.trim(),                    // ✅ Backend field
      leave_type: leaveType.trim(),             // ✅ Backend field
    });

    if (success) {
      setReason('');
      setLeaveType('');
      setStartDate('');
      setEndDate('');
      setTotalDays(0);
      if (onClose) onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/40 fixed inset-0 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-white pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Apply for Leave</h2>
              <p className="text-sm text-gray-500">Fill in the details below to request leave.</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Employee Information Section */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <h3 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Employee Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Employee Name</p>
              <div className="flex items-center gap-2 text-sm bg-white border border-purple-200 rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-gray-800">{user.name || user.username}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Employee Email</p>
              <div className="flex items-center gap-2 text-sm bg-white border border-purple-200 rounded-lg px-3 py-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-gray-800 break-all">{user.email}</span>
              </div>
            </div>
            {/* ✅ NEW: Position */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Position</p>
              <div className="flex items-center gap-2 text-sm bg-white border border-purple-200 rounded-lg px-3 py-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-gray-800">{user.position || 'N/A'}</span>
              </div>
            </div>
            {/* ✅ NEW: Joining Date */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Joining Date</p>
              <div className="flex items-center gap-2 text-sm bg-white border border-purple-200 rounded-lg px-3 py-2">
                <CalendarDays className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-gray-800">
                  {user.joining_date ? formatDate(user.joining_date) : 'N/A'}
                </span>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-xs font-medium text-gray-500">Supervisor Email</p>
              <div className="flex items-center gap-2 text-sm bg-white border border-purple-200 rounded-lg px-3 py-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-gray-800 break-all">
                  {user.supervisor_email || 'Not Assigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Details Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            Leave Details
          </h3>

          {/* Date range + days */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={startDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                min={today}
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={endDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                min={startDate || today}
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">Total Days</label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm flex items-center">
                <span className="font-semibold text-gray-800">{totalDays > 0 ? totalDays : '-'}</span>
              </div>
            </div>
          </div>

          {/* Leave Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Leave Type</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <option value="">Select Leave Type</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <FileText className="w-4 h-4 text-gray-400" />
              Reason for Leave
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[90px] resize-y"
              placeholder="Describe the reason for your leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        {/* Error / Success */}
        {displayError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs">
            {displayError}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-xs">
            {successMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white border-t pt-4">
          {onClose && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !user.supervisor_email || totalDays <= 0}
            title={!user.supervisor_email ? 'No supervisor email assigned' : 'Submit leave request'}
            className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}