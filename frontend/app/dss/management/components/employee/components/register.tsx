// components/management/employee/components/register.tsx
import { useState, useEffect } from 'react';
import { User, Mail, Lock, Building2, Briefcase, UserCheck } from 'lucide-react';
import { useRegister } from '@/contexts/management/EmployeeContext/RegisterContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (userData: any) => void;
}

export default function EmployeeRegister({ onSwitchToLogin, onRegisterSuccess }: RegisterProps) {
  const { 
    register, 
    isLoading, 
    error: contextError,
    departments,
    isLoadingEmployers,
    getProjectsByDepartment,
    getSupervisorsByProject
  } = useRegister();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    supervisor: '',
    projectName: ''
  });
  
  const [localError, setLocalError] = useState('');
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<string[]>([]);

  // Update available projects when department changes
  useEffect(() => {
    if (formData.department) {
      const projects = getProjectsByDepartment(formData.department);
      setAvailableProjects(projects);
      
      // Reset project and supervisor when department changes
      setFormData(prev => ({ ...prev, projectName: '', supervisor: '' }));
      setAvailableSupervisors([]);
    } else {
      setAvailableProjects([]);
      setAvailableSupervisors([]);
    }
  }, [formData.department, getProjectsByDepartment]);

  // Update available supervisors when project changes
  useEffect(() => {
    if (formData.projectName && formData.department) {
      const supervisors = getSupervisorsByProject(formData.department, formData.projectName);
      setAvailableSupervisors(supervisors);
      
      // Reset supervisor when project changes
      setFormData(prev => ({ ...prev, supervisor: '' }));
    } else {
      setAvailableSupervisors([]);
    }
  }, [formData.projectName, formData.department, getSupervisorsByProject]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleRegister = async () => {
    setLocalError('');

    const result = await register(formData);
    
    if (result.success && result.userData) {
      onRegisterSuccess(result.userData);
    }
  };

  const displayError = contextError || localError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Join Our Team</h2>
            <p className="text-gray-500">Register your employee account</p>
          </div>

          {isLoadingEmployers && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm text-center">
              Loading departments data...
            </div>
          )}

          <div className="space-y-5">
            {/* Username and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="johndoe"
                    disabled={isLoading || isLoadingEmployers}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="john@example.com"
                    disabled={isLoading || isLoadingEmployers}
                  />
                </div>
              </div>
            </div>

            {/* Department Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Department *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white"
                  disabled={isLoading || isLoadingEmployers}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Name Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Project Name *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isLoading || isLoadingEmployers || !formData.department}
                >
                  <option value="">
                    {formData.department ? 'Select Project' : 'Select Department First'}
                  </option>
                  {availableProjects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Supervisor Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Under Supervisor *</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isLoading || isLoadingEmployers || !formData.projectName}
                >
                  <option value="">
                    {formData.projectName ? 'Select Supervisor' : 'Select Project First'}
                  </option>
                  {availableSupervisors.map((supervisor) => (
                    <option key={supervisor} value={supervisor}>
                      {supervisor}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    disabled={isLoading || isLoadingEmployers}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    disabled={isLoading || isLoadingEmployers}
                  />
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 6 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {displayError}
              </div>
            )}

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={isLoading || isLoadingEmployers}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                disabled={isLoading || isLoadingEmployers}
                className="text-teal-600 font-semibold hover:text-teal-700 transition disabled:opacity-50"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}