// components/management/employee/components/dashboard.tsx
import { User, Mail, Building2, Briefcase, UserCheck, LogOut } from 'lucide-react';
import { useLogin } from '@/contexts/management/EmployeeContext/LoginContext';

export default function EmployeeDashboard() {
    const { user, logout } = useLogin();

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Employee Dashboard</h1>
                                <p className="text-sm text-gray-500">Welcome back, {user?.username}</p>
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
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform hover:scale-105 transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Email</p>
                                <p className="text-xl font-bold text-gray-800 mt-1 break-all">{user?.email}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Mail className="w-10 h-10 text-green-500" />
                            </div>
                        </div>
                    </div>

                    {/* Department Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500 transform hover:scale-105 transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Department</p>
                                <p className="text-xl font-bold text-gray-800 mt-1">{user?.department || 'N/A'}</p>
                            </div>
                            <div className="bg-teal-100 p-3 rounded-lg">
                                <Building2 className="w-10 h-10 text-teal-500" />
                            </div>
                        </div>
                    </div>

                    {/* Supervisor Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500 transform hover:scale-105 transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Supervisor</p>
                                <p className="text-xl font-bold text-gray-800 mt-1">{user?.supervisor || 'N/A'}</p>
                            </div>
                            <div className="bg-cyan-100 p-3 rounded-lg">
                                <UserCheck className="w-10 h-10 text-cyan-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Information Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="w-6 h-6 text-green-500" />
                        User Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 font-medium">Under Supervisor</p>
                            <p className="text-lg font-semibold text-gray-800 mt-1">{user?.supervisor || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Current Project Section */}
                {user?.projectName && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Briefcase className="w-6 h-6 text-teal-500" />
                            Current Project
                        </h2>
                        <div className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition transform hover:scale-105">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Briefcase className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{user.projectName}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                                        <p className="text-gray-600 font-medium">Active Project</p>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                        <UserCheck className="w-4 h-4" />
                                        <span>Supervised by {user.supervisor}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Project Message */}
                {!user?.projectName && (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Briefcase className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Project Assigned</h3>
                        <p className="text-gray-500">You don't have any project assigned at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}