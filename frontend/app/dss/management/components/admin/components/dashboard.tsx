import React, { useState } from 'react';
import { User, Mail, Building2, Briefcase, LogOut, ArrowLeft } from 'lucide-react';
import { useLogin } from '@/contexts/management/AdminContext/LoginContext';
import { useDashboard } from '@/contexts/management/AdminContext/DashboardContext';

export default function AdminDashboard() {
  const { user, logout } = useLogin();
  const { employees, loading, error, filterByProjects } = useDashboard();
  const [showProjectEmployees, setShowProjectEmployees] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState('');

  if (!user) {
    return null;
  }

  const handleProjectClick = async (projectName: string) => {
    setSelectedProjectName(projectName);
    await filterByProjects([projectName]);
    setShowProjectEmployees(true);
  };

  const handleBackToDashboard = () => {
    setShowProjectEmployees(false);
    setSelectedProjectName('');
  };

  // Show project-specific employees
  if (showProjectEmployees) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToDashboard}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{selectedProjectName}</h1>
                  <p className="text-sm text-gray-500">Project Employees</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition transform hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Project Employees */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Employees in {selectedProjectName} ({employees.length})
            </h2>
            {loading ? (
              <p className="text-gray-500">Loading employees...</p>
            ) : employees.length === 0 ? (
              <p className="text-gray-500">No employees found for this project</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.displayName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.supervisor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              employee.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name || user?.username}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition transform hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Email</p>
                <p className="text-xl font-bold text-gray-800 mt-1 break-all">{user?.email}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Mail className="w-10 h-10 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Department</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{user?.department || 'N/A'}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Building2 className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Projects</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{user?.projects?.length || 0}</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg">
                <Briefcase className="w-10 h-10 text-pink-500" />
              </div>
            </div>
          </div>
        </div>

        {/* User Information Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            User Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium">Full Name</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">{user?.name || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium">Username</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">{user?.username || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium">Email Address</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">{user?.email || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium">Department</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">{user?.department || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Projects Section - Clickable */}
        {user?.projects && user.projects.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-purple-500" />
              Your Projects
            </h2>
            <p className="text-sm text-gray-500 mb-4">Click on any project to view its employees</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.projects.map((project: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleProjectClick(project)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition transform hover:scale-105 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{project}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        <p className="text-sm text-gray-500">Click to view employees</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Projects Message */}
        {(!user?.projects || user.projects.length === 0) && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Projects Yet</h3>
            <p className="text-gray-500">You don't have any projects assigned at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}