'use client';

import React, { useState } from 'react';
import { Users, Search, Mail, Briefcase, User } from 'lucide-react';
import { useDashboard } from '@/contexts/management/AdminContext/DashboardContext';

export default function EmployeeList() {
  const { employees, loading, error } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employee List</h1>
            <p className="text-gray-500 text-sm">Filtered by selected projects</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Employee Cards */}
        {loading ? (
          <p className="text-gray-600">Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="text-gray-600">No employees found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="bg-white rounded-xl shadow-lg p-5 border hover:border-blue-500 transition">

                <h3 className="font-bold text-lg mb-2 text-gray-800">{emp.name}</h3>

                <div className="space-y-2 text-sm text-gray-600">

                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{emp.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{emp.projectName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{emp.department}</span>
                  </div>

                  <div className="mt-3 text-xs bg-gray-50 p-2 rounded">
                    <p><b>Supervisor:</b> {emp.supervisor_name}</p>
                    <p><b>Email:</b> {emp.supervisor_email || 'N/A'}</p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-xs text-gray-500">{emp.department}</span>
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        emp.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
