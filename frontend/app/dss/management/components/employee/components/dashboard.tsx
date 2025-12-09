// components/management/employee/components/dashboard.tsx
'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Building2,
  Briefcase,
  UserCheck,
  LogOut,
  Activity,
  Clock as ClockIcon,
  Shield,
  AlertCircle,
  Calendar,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLogin } from '@/contexts/management/EmployeeContext/LoginContext';
import { useLeave } from '@/contexts/management/EmployeeContext/ApplyLeaveContext';
import LeaveRequestForm from './applyleave';

export default function EmployeeDashboard() {
  const { user, logout, isLoading } = useLogin();
  const { leaves, totalLeaves, loadingLeaves } = useLeave();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showLeaveHistory, setShowLeaveHistory] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
  };

  const formatLastLogin = (timestamp?: string) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const supervisorEmail = user.supervisor_email || 'Not Assigned';
  const supervisorName = user.supervisor_name || 'Not Assigned';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b-2 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Employee Dashboard</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  Welcome back,{' '}
                  <span className="font-semibold text-green-600">{user.username}</span>
                  {user.is_active && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Activity className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Status Banner */}
        {user.is_active && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">Your session is active</p>
                  <p className="text-sm text-green-50 flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    Last login: {formatLastLogin(user.last_login)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="font-medium">Online</span>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Leaves Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-all hover:shadow-xl cursor-pointer group" onClick={() => setShowLeaveHistory(!showLeaveHistory)}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-sm font-medium mb-1">Total Leave Requests</p>
                <p className="text-3xl font-bold text-purple-600 group-hover:text-purple-700">{totalLeaves}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg flex-shrink-0 group-hover:bg-purple-200 transition-all">
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-2 font-medium flex items-center gap-1">
              {showLeaveHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showLeaveHistory ? 'Hide' : 'View'} History
            </p>
          </div>

          {/* Email Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform hover:scale-105 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-sm font-medium mb-1">Email</p>
                <p className="text-lg font-bold text-gray-800 truncate">{user.email}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Department Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500 transform hover:scale-105 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Department</p>
                <p className="text-lg font-bold text-gray-800 capitalize">
                  {user.department || 'N/A'}
                </p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <Building2 className="w-8 h-8 text-teal-500" />
              </div>
            </div>
          </div>

          {/* Supervisor Email Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500 transform hover:scale-105 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-sm font-medium mb-1">Supervisor Email</p>
                <p className="text-lg font-bold text-gray-800 break-all">
                  {supervisorEmail}
                </p>
                {supervisorEmail === 'Not Assigned' && (
                  <p className="text-xs text-orange-600 mt-1">Contact admin</p>
                )}
              </div>
              <div className="bg-cyan-100 p-3 rounded-lg">
                <UserCheck className="w-8 h-8 text-cyan-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ SMALL Apply Leave Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-xl mb-8 text-center max-w-sm mx-auto hover:shadow-2xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="w-10 h-10 opacity-90" />
            <button
              onClick={() => setShowLeaveForm(true)}
              disabled={!user.supervisor_email}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={!user.supervisor_email ? 'No supervisor assigned' : 'Apply for leave'}
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-bold mb-1">Apply for Leave</h3>
          <p className="text-purple-100 text-sm">Submit a new request</p>
        </div>

        {/* ✅ COLLAPSIBLE Leave History */}
        {showLeaveHistory && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-7 h-7 text-purple-500" />
                Leave History
              </h2>
              <button
                onClick={() => setShowLeaveHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {loadingLeaves ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading leave records...</p>
                </div>
              </div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No leave requests found</h3>
                <p className="text-gray-400">Your leave history will appear here once you submit requests.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {leaves.map((leave) => (
                  <div key={leave.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-purple-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.approval_status)}`}>
                          {leave.approval_status.toUpperCase()}
                        </div>
                        <h4 className="font-bold text-sm text-gray-800">{leave.leave_type}</h4>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        leave.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                        leave.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.approval_status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs">
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Period</p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Days</p>
                        <p className="font-semibold text-purple-600">{leave.total_days}</p>
                      </div>
                    </div>

                    <div className="text-xs mb-2">
                      <p className="text-gray-500 font-medium mb-1">Reason</p>
                      <p className="text-gray-700 line-clamp-2 bg-gray-50 p-2 rounded">{leave.reason}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Applied</p>
                        <p className="font-medium text-gray-800">{formatDate(leave.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Supervisor</p>
                        <p className="text-gray-700 break-all text-[10px]">{leave.supervisor_email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Information Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-6 h-6 text-green-500" />
            User Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-medium mb-1">Full Name</p>
              <p className="text-lg font-semibold text-gray-800">
                {user.name || user.username || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-medium mb-1">Username</p>
              <p className="text-lg font-semibold text-gray-800">
                {user.username || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-medium mb-1">Email Address</p>
              <p className="text-lg font-semibold text-gray-800 break-all">
                {user.email || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-medium mb-1">Department</p>
              <p className="text-lg font-semibold text-gray-800 capitalize">
                {user.department || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-medium mb-1">Supervisor</p>
              <p className="text-lg font-semibold text-gray-800 break-all">
                {supervisorName}
              </p>
              {supervisorName === 'Not Assigned' && (
                <p className="text-xs text-orange-600 mt-1">No supervisor assigned</p>
              )}
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-medium mb-1">Supervisor Email</p>
              <p className="text-lg font-semibold text-gray-800 break-all">
                {supervisorEmail}
              </p>
              {supervisorEmail === 'Not Assigned' && (
                <p className="text-xs text-orange-600 mt-1">No supervisor assigned</p>
              )}
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 font-medium mb-1">Account Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    user.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                ></div>
                <p
                  className={`text-lg font-semibold ${
                    user.is_active ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Project Section */}
        {user.projectName ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-teal-500" />
              Current Project
            </h2>
            <div className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-lg transition-all transform hover:scale-[1.02] bg-gradient-to-br from-green-50 to-teal-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {user.projectName}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-green-600 font-semibold">Active Project</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      <span>
                        Supervised by{' '}
                        <span className="font-semibold break-all">
                          {supervisorName} {supervisorEmail && `(${supervisorEmail})`}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-semibold capitalize">
                        {user.department}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Project Assigned
            </h3>
            <p className="text-gray-500">
              You don't have any project assigned at the moment.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Contact your supervisor for project assignment.
            </p>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Confirm Logout</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to log out?
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Your account will be set to{' '}
              <span className="font-semibold text-red-600">inactive</span> and you'll
              need to log in again to access your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveForm && (
        <LeaveRequestForm onClose={() => setShowLeaveForm(false)} />
      )}
    </div>
  );
}
