// components/management/admin/components/register.tsx
import { useState } from 'react';
import { User, Mail, Lock, Building2, Briefcase, Check, X } from 'lucide-react';
import { useRegister, RegisterData } from '@/contexts/management/AdminContext/RegisterContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (userData: any) => void;
}

export default function AdminRegister({ onSwitchToLogin, onRegisterSuccess }: RegisterProps) {
  const { register, isLoading, error: contextError } = useRegister();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    department: 'Civil',
    projects: [] as string[]
  });
  const [localError, setLocalError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setLocalError('');
  };

  const toggleProject = (project: string, checked: boolean) => {
    const currentProjects = formData.projects;
    if (checked) {
      setFormData({ 
        ...formData, 
        projects: [...currentProjects, project] 
      });
    } else {
      setFormData({ 
        ...formData, 
        projects: currentProjects.filter(p => p !== project) 
      });
    }
  };

  const handleRegister = async () => {
    setLocalError('');

    const registrationData: RegisterData = {
      ...formData
    };

    const result = await register(registrationData);
    
    if (result.success && result.userData) {
      onRegisterSuccess(result.userData);
    }
  };

  const displayError = contextError || localError;

  const projectOptions = [
    { value: 'DSS', label: 'DSS' },
    { value: 'SLCR', label: 'SLCR' },
    { value: 'Danish', label: 'Danish' },
    { value: 'Kumbh', label: 'Kumbh' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-500">Register your admin account</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="johndoe"
                    disabled={isLoading}
                  />
                </div>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="john@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Department dropdown - only Civil */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Department *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none bg-white"
                  disabled={isLoading}
                >
                  <option value="Civil">Civil</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Projects checkboxes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Projects * (Select multiple)</label>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-2 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {projectOptions.map((project) => (
                    <label key={project.value} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white rounded-lg transition">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.projects.includes(project.value)}
                          onChange={(e) => toggleProject(project.value, e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          disabled={isLoading}
                        />
                        <Check className="w-4 h-4 absolute inset-0 pointer-events-none text-purple-600 opacity-0 group-hover:opacity-20" />
                      </div>
                      <span className="text-sm text-gray-700">{project.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {formData.projects.length > 0 
                  ? `Selected: ${formData.projects.join(', ')}`
                  : 'Select at least one project'
                }
              </p>
            </div>

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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    disabled={isLoading}
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 6 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            {displayError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {displayError}
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                disabled={isLoading}
                className="text-purple-600 font-semibold hover:text-purple-700 transition disabled:opacity-50"
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
