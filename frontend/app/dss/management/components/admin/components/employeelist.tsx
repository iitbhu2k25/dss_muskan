'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Briefcase, 
  User, 
  FileText, 
  ChevronDown, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  Edit2,
  RotateCcw,
} from 'lucide-react';
import { useDashboard } from '@/contexts/management/AdminContext/DashboardContext';

export default function EmployeeList() {
  const { 
    employees, 
    loading, 
    error, 
    fetchEmployeeLeaves, 
    employeeLeaves, 
    leavesLoading,
    approveLeave 
  } = useDashboard();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [editingLeave, setEditingLeave] = useState<number | null>(null);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEmployeeLeaves = async (email: string) => {
    if (expandedEmployee === email) {
      setExpandedEmployee(null);
      setEditingLeave(null);
    } else {
      await fetchEmployeeLeaves(email);
      setExpandedEmployee(email);
    }
  };

  const handleApprove = async (leaveId: number, email: string, status: 'approved' | 'rejected') => {
    const success = await approveLeave(leaveId, status);
    if (success) {
      // Refresh leaves for this employee
      await fetchEmployeeLeaves(email);
      setEditingLeave(null);
    }
  };

  const toggleEditMode = (leaveId: number) => {
    setEditingLeave(editingLeave === leaveId ? null : leaveId);
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      default: return 'bg-yellow-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employee List</h1>
            <p className="text-gray-500 text-sm">Manage employees and their leave requests</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Employee Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No employees found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all border hover:border-blue-500">
                {/* Employee Header - Click to Expand */}
                <div 
                  className="p-6 border-b hover:bg-gray-50 cursor-pointer" 
                  onClick={() => toggleEmployeeLeaves(emp.email)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{emp.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="break-all">{emp.email}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 text-xs rounded-full font-semibold ${
                      emp.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      <span>{emp.projectName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="capitalize">{emp.department}</span>
                    </div>
                  </div>

                  {/* ✅ Leave Count & Toggle */}
                  <div className={`flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 ${
                    expandedEmployee === emp.email ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    <FileText className={`w-4 h-4 ${expandedEmployee === emp.email ? 'text-blue-500' : ''}`} />
                    <span className="text-sm font-medium flex-1">
                      {expandedEmployee === emp.email 
                        ? `${employeeLeaves[emp.email]?.length || 0} Leave Requests` 
                        : 'View Leave Requests'
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedEmployee === emp.email ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* ✅ EXPANDABLE LEAVE HISTORY */}
                {expandedEmployee === emp.email && (
                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                      <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Leave Requests ({employeeLeaves[emp.email]?.length || 0})
                      </h4>
                      {leavesLoading[emp.email] && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>

                    {employeeLeaves[emp.email]?.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm font-medium">No leave requests found</p>
                        <p className="text-gray-400 text-xs mt-1">This employee has no pending leave requests</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {employeeLeaves[emp.email]?.map((leave) => (
                          <div key={leave.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-blue-300">
                            {/* Leave Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.approval_status)}`}>
                                  {leave.approval_status.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-semibold text-sm text-gray-800 truncate">{leave.leave_type}</h5>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(leave.created_at)} • {leave.total_days} days
                                  </p>
                                </div>
                              </div>
                              {/* Edit Button for Approved/Rejected */}
                              {leave.approval_status !== 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEditMode(leave.id);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    editingLeave === leave.id
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                                  }`}
                                  title="Edit decision"
                                >
                                  {editingLeave === leave.id ? (
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  ) : (
                                    <Edit2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Leave Details */}
                            <div className="grid grid-cols-1 gap-2 mb-4 text-xs">
                              <div>
                                <span className="text-gray-500 font-medium">Period:</span>
                                <span className="font-semibold ml-1 text-sm">
                                  {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">Supervisor:</span>
                                <span className="font-medium ml-1 text-blue-600 break-all text-[11px]">
                                  {leave.supervisor_email}
                                </span>
                              </div>
                              <div className="text-gray-700 line-clamp-2 bg-gray-50 p-1.5 rounded text-[11px] leading-relaxed">
                                {leave.reason}
                              </div>
                            </div>

                            {/* ✅ ACTION BUTTONS */}
                            {/* Show for pending OR when editing approved/rejected */}
                            {(leave.approval_status === 'pending' || editingLeave === leave.id) && (
                              <div className="space-y-2 pt-3 border-t border-gray-100">
                                {editingLeave === leave.id && leave.approval_status !== 'pending' && (
                                  <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                    <p className="text-xs text-blue-700 font-medium">
                                      Change decision from <span className="font-bold capitalize">{leave.approval_status}</span>
                                    </p>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(leave.id, emp.email, 'approved');
                                    }}
                                    className={`flex-1 py-2 px-3 text-white text-xs rounded-lg font-semibold transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow-md disabled:opacity-50 ${
                                      leave.approval_status === 'approved' && editingLeave !== leave.id
                                        ? 'bg-green-400 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600'
                                    }`}
                                    disabled={leavesLoading[emp.email] || (leave.approval_status === 'approved' && editingLeave !== leave.id)}
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    {leave.approval_status === 'approved' && editingLeave !== leave.id ? 'Approved' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(leave.id, emp.email, 'rejected');
                                    }}
                                    className={`flex-1 py-2 px-3 text-white text-xs rounded-lg font-semibold transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow-md disabled:opacity-50 ${
                                      leave.approval_status === 'rejected' && editingLeave !== leave.id
                                        ? 'bg-red-400 cursor-not-allowed'
                                        : 'bg-red-500 hover:bg-red-600'
                                    }`}
                                    disabled={leavesLoading[emp.email] || (leave.approval_status === 'rejected' && editingLeave !== leave.id)}
                                  >
                                    <XCircle className="w-3 h-3" />
                                    {leave.approval_status === 'rejected' && editingLeave !== leave.id ? 'Rejected' : 'Reject'}
                                  </button>
                                </div>
                                {editingLeave === leave.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingLeave(null);
                                    }}
                                    className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg font-medium transition-all"
                                  >
                                    Cancel Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Show status badge for approved/rejected when NOT editing */}
                            {leave.approval_status !== 'pending' && editingLeave !== leave.id && (
                              <div className="pt-3 border-t border-gray-100">
                                <div className={`py-2 px-3 rounded-lg text-xs font-semibold text-center ${getStatusBadgeColor(leave.approval_status)}`}>
                                  {leave.approval_status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                  <span className="ml-2 opacity-75">• Click edit to change</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}