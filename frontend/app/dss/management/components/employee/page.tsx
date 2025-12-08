// components/management/employee/page.tsx
'use client';
import { useState } from 'react';
import { LoginProvider, useLogin } from '@/contexts/management/EmployeeContext/LoginContext';
import { RegisterProvider } from '@/contexts/management/EmployeeContext/RegisterContext';
import EmployeeLogin from './components/login';
import EmployeeRegister from './components/register';
import EmployeeDashboard from './components/dashboard';

// Auth Wrapper Component
function AuthWrapper() {
  const { user, loginWithUserData } = useLogin();
  const [showRegister, setShowRegister] = useState(false);

  // If user is logged in, show dashboard
  if (user) {
    return <EmployeeDashboard />;
  }

  // If showing register screen
  if (showRegister) {
    return (
      <RegisterProvider>
        <EmployeeRegister
          onSwitchToLogin={() => setShowRegister(false)}
          onRegisterSuccess={(userData) => {
            // After successful registration, auto-login the user
            loginWithUserData(userData);
          }}
        />
      </RegisterProvider>
    );
  }

  // Default: show login
  return <EmployeeLogin onSwitchToRegister={() => setShowRegister(true)} />;
}

// Main Employee Page Component
export default function EmployeePage() {
  return (
    <LoginProvider>
      <AuthWrapper />
    </LoginProvider>
  );
}