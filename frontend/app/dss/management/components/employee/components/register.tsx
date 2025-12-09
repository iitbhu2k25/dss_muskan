// components/management/employee/components/register.tsx
import { useState, useEffect, ChangeEvent } from 'react';
import { User, Mail, Lock, Building2, Briefcase, UserCheck } from 'lucide-react';
import {
  useRegister,
  type RegisterData,
} from '@/contexts/management/EmployeeContext/RegisterContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (userData: any) => void;
}

export default function EmployeeRegister({
  onSwitchToLogin,
  onRegisterSuccess,
}: RegisterProps) {
  const {
    register,
    isLoading,
    error: contextError,
    departments,
    isLoadingEmployers,
    getProjectsByDepartment,
    getSupervisorsByProject,
  } = useRegister();

  // ------------------------------------------------------------------ STATE
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    supervisor_email: '', // ✅ matches context
    projectName: '',
  });

  const [localError, setLocalError] = useState('');
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<string[]>([]);

  // ------------------------------------------------------------------ EFFECTS
  // 1. Department → projects
  useEffect(() => {
    if (formData.department) {
      const projects = getProjectsByDepartment(formData.department);
      setAvailableProjects(projects);
      setFormData((p) => ({
        ...p,
        projectName: '',
        supervisor_email: '', // reset when department changes
      }));
      setAvailableSupervisors([]);
    } else {
      setAvailableProjects([]);
      setAvailableSupervisors([]);
    }
  }, [formData.department, getProjectsByDepartment]);

  // 2. Project → supervisors
  useEffect(() => {
    if (formData.projectName && formData.department) {
      const sups = getSupervisorsByProject(formData.department, formData.projectName);
      setAvailableSupervisors(sups);
      // reset selection (will be auto-filled later if only one)
      setFormData((p) => ({ ...p, supervisor_email: '' }));
    } else {
      setAvailableSupervisors([]);
    }
  }, [formData.projectName, formData.department, getSupervisorsByProject]);

  // 3. Auto-select when only ONE supervisor exists
  useEffect(() => {
    if (availableSupervisors.length === 1) {
      setFormData((p) => ({ ...p, supervisor_email: availableSupervisors[0] }));
    } else if (
      availableSupervisors.length > 1 &&
      formData.supervisor_email &&
      !availableSupervisors.includes(formData.supervisor_email)
    ) {
      setFormData((p) => ({ ...p, supervisor_email: '' }));
    }
  }, [availableSupervisors, formData.supervisor_email]);

  // ------------------------------------------------------------------ HANDLERS
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
  const isSingleSupervisor = availableSupervisors.length === 1;

  // ------------------------------------------------------------------ RENDER
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-green-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Join Our Team</h2>
            <p className="text-gray-500">Register your employee account</p>
          </div>

          {isLoadingEmployers && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm text-center">
              Loading departments & projects...
            </div>
          )}

          <div className="space-y-5">
            {/* Username & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Username *
                </label>
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
                <label className="text-sm font-medium text-gray-700">
                  Email Address *
                </label>
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

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Department *
              </label>
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
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Project Name *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white disabled:bg-gray-100"
                  disabled={!formData.department || isLoadingEmployers}
                >
                  <option value="">
                    {formData.department ? 'Select Project' : 'Select Department First'}
                  </option>
                  {availableProjects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Supervisor Email – auto-select when only one */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span>Supervisor Email *</span>
                {isSingleSupervisor && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Auto-selected
                  </span>
                )}
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  name="supervisor_email"              // ✅ name matches RegisterData
                  value={formData.supervisor_email}    // ✅ bound to email field
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none bg-white disabled:bg-gray-100"
                  disabled={
                    !formData.projectName ||
                    isLoadingEmployers ||
                    isSingleSupervisor
                  }
                >
                  <option value="">
                    {availableSupervisors.length === 0
                      ? 'No supervisors'
                      : isSingleSupervisor
                      ? `Auto-selected: ${availableSupervisors[0]}`
                      : 'Select Supervisor Email'}
                  </option>
                  {availableSupervisors.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </div>

              {isSingleSupervisor && (
                <p className="text-xs text-green-600 mt-1">
                  Only one supervisor for this project – automatically selected.
                </p>
              )}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password *
                </label>
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
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
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

            {/* Password rules */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 6 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            {/* Error */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {displayError}
              </div>
            )}

            {/* Submit */}
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
