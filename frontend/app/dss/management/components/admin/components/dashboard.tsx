// components/management/admin/components/dashboard.tsx
import { User, Mail, Building2, Briefcase, LogOut } from 'lucide-react';
import { useLogin } from '@/contexts/management/AdminContext/LoginContext';

export default function AdminDashboard() {
  const { user, logout } = useLogin();

  if (!user) {
    return null;
  }

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
          {/* Email Card */}
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

          {/* Department Card */}
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

          {/* Projects Count Card */}
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

        {/* Projects Section */}
        {user?.projects && user.projects.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-purple-500" />
              Your Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.projects.map((project: string, index: number) => (
                <div
                  key={index}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition transform hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{project}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        <p className="text-sm text-gray-500">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
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