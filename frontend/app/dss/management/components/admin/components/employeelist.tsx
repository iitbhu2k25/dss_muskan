import React, { useState } from 'react';
import { Users, Search, Mail, Briefcase } from 'lucide-react';
import { useDashboard } from '@/contexts/management/AdminContext/DashboardContext';

export default function EmployeeList() {
  const { employees, loading, error } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeEmployees = filteredEmployees.filter(emp => emp.is_active);
  const inactiveEmployees = filteredEmployees.filter(emp => !emp.is_active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Employee List</h1>
              <p className="text-sm text-gray-500">View all employees</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or project..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Active Employees */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-500" />
            Active Employees ({activeEmployees.length})
          </h2>
          {loading && activeEmployees.length === 0 ? (
            <p className="text-gray-500">Loading...</p>
          ) : activeEmployees.length === 0 ? (
            <p className="text-gray-500">No active employees found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEmployees.map((employee) => (
                <div key={employee.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-800 text-lg">{employee.name}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="truncate">{employee.projectName}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">{employee.department}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactive Employees */}
        {inactiveEmployees.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-red-500" />
              Inactive Employees ({inactiveEmployees.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveEmployees.map((employee) => (
                <div key={employee.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-orange-500 transition opacity-75">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-800 text-lg">{employee.displayName}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="truncate">{employee.projectName}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">{employee.department}</span>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Inactive</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}