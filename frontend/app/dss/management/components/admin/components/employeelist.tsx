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
  CalendarDays,
  Building2,
  UserCheck,
  ChevronUp,
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
    emp.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
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
      await fetchEmployeeLeaves(email);
      setEditingLeave(null);
    }
  };

  const toggleEditMode = (leaveId: number) => {
    setEditingLeave(editingLeave === leaveId ? null : leaveId);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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
      <div className="max-w-[1600px] mx-auto">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, position, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Employee Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No employees found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Employee Info</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Position</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Department</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Project</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Joining Date</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Supervisor</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Status</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((emp) => (
                    <React.Fragment key={emp.id}>
                      {/* Employee Row */}
                      <tr 
                        className={`hover:bg-blue-50 transition-colors ${
                          expandedEmployee === emp.email ? 'bg-blue-50' : ''
                        }`}
                      >
                        {/* Employee Info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{emp.name}</p>
                              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Position */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {emp.position || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 capitalize truncate">
                              {emp.department}
                            </span>
                          </div>
                        </td>

                        {/* Project */}
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-700 truncate block">
                            {emp.projectName}
                          </span>
                        </td>

                        {/* Joining Date */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-800">
                                {formatDate(emp.joining_date || '')}
                              </span>
                            </div>
                            {emp.resign_date && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                <span className="text-xs font-medium text-red-700">
                                  Resigned: {formatDate(emp.resign_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Supervisor */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">
                              {emp.supervisor_name}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            emp.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {emp.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleEmployeeLeaves(emp.email)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              expandedEmployee === emp.email
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span className="hidden lg:inline">
                              {expandedEmployee === emp.email ? 'Hide' : 'View'} Leaves
                            </span>
                            {expandedEmployee === emp.email ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Leave Requests */}
                      {expandedEmployee === emp.email && (
                        <tr>
                          <td colSpan={8} className="bg-gray-50 p-6 border-t-2 border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                Leave Requests for {emp.name}
                                <span className="text-blue-600">({employeeLeaves[emp.email]?.length || 0})</span>
                              </h4>
                              {leavesLoading[emp.email] && (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>

                            {employeeLeaves[emp.email]?.length === 0 ? (
                              <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm font-medium">No leave requests found</p>
                                <p className="text-gray-400 text-xs mt-1">This employee has no leave requests</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {employeeLeaves[emp.email]?.map((leave) => (
                                  <div key={leave.id} className="bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all hover:border-blue-300">
                                    {/* Leave Header */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(leave.approval_status)}`}>
                                          {leave.approval_status.toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <h5 className="font-bold text-sm text-gray-800 truncate">{leave.leave_type}</h5>
                                          <p className="text-xs text-gray-500">
                                            {leave.total_days} day{leave.total_days > 1 ? 's' : ''}
                                          </p>
                                        </div>
                                      </div>
                                      {leave.approval_status !== 'pending' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleEditMode(leave.id);
                                          }}
                                          className={`p-2 rounded-lg transition-all ${
                                            editingLeave === leave.id
                                              ? 'bg-blue-500 text-white'
                                              : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                                          }`}
                                          title="Edit decision"
                                        >
                                          {editingLeave === leave.id ? (
                                            <RotateCcw className="w-4 h-4" />
                                          ) : (
                                            <Edit2 className="w-4 h-4" />
                                          )}
                                        </button>
                                      )}
                                    </div>

                                    {/* Leave Details */}
                                    <div className="space-y-2 mb-3 text-xs">
                                      <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                                        <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                        <div>
                                          <span className="text-gray-600 font-medium">Period:</span>
                                          <p className="font-semibold text-gray-800">
                                            {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start gap-2 bg-purple-50 p-2 rounded">
                                        <UserCheck className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0 flex-1">
                                          <span className="text-gray-600 font-medium">Supervisor:</span>
                                          <p className="font-medium text-purple-700 break-all text-[11px]">
                                            {leave.supervisor_email}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-gray-600 font-medium mb-1">Reason:</p>
                                        <p className="text-gray-700 text-[11px] leading-relaxed line-clamp-2">
                                          {leave.reason}
                                        </p>
                                      </div>

                                      <div className="text-gray-500 text-[10px] flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Applied: {formatDate(leave.created_at)}
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {(leave.approval_status === 'pending' || editingLeave === leave.id) && (
                                      <div className="space-y-2 pt-3 border-t-2 border-gray-100">
                                        {editingLeave === leave.id && leave.approval_status !== 'pending' && (
                                          <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                            <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                            <p className="text-xs text-blue-700 font-medium">
                                              Change from <span className="font-bold capitalize">{leave.approval_status}</span>
                                            </p>
                                          </div>
                                        )}
                                        <div className="flex gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleApprove(leave.id, emp.email, 'approved');
                                            }}
                                            className={`flex-1 py-2.5 px-3 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50 ${
                                              leave.approval_status === 'approved' && editingLeave !== leave.id
                                                ? 'bg-green-400 cursor-not-allowed'
                                                : 'bg-green-500 hover:bg-green-600'
                                            }`}
                                            disabled={leavesLoading[emp.email] || (leave.approval_status === 'approved' && editingLeave !== leave.id)}
                                          >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            {leave.approval_status === 'approved' && editingLeave !== leave.id ? 'Approved' : 'Approve'}
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleApprove(leave.id, emp.email, 'rejected');
                                            }}
                                            className={`flex-1 py-2.5 px-3 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50 ${
                                              leave.approval_status === 'rejected' && editingLeave !== leave.id
                                                ? 'bg-red-400 cursor-not-allowed'
                                                : 'bg-red-500 hover:bg-red-600'
                                            }`}
                                            disabled={leavesLoading[emp.email] || (leave.approval_status === 'rejected' && editingLeave !== leave.id)}
                                          >
                                            <XCircle className="w-3.5 h-3.5" />
                                            {leave.approval_status === 'rejected' && editingLeave !== leave.id ? 'Rejected' : 'Reject'}
                                          </button>
                                        </div>
                                        {editingLeave === leave.id && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingLeave(null);
                                            }}
                                            className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg font-semibold transition-all"
                                          >
                                            Cancel Edit
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* Status Badge */}
                                    {leave.approval_status !== 'pending' && editingLeave !== leave.id && (
                                      <div className="pt-3 border-t-2 border-gray-100">
                                        <div className={`py-2.5 px-3 rounded-lg text-xs font-bold text-center shadow-sm ${getStatusBadgeColor(leave.approval_status)}`}>
                                          {leave.approval_status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                          <span className="ml-2 opacity-75 font-normal">• Click edit to change</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}