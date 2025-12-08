// components/management/admin/page.tsx
import { useState } from 'react';
import { LoginProvider, useLogin } from '@/contexts/management/AdminContext/LoginContext';
import { RegisterProvider } from '@/contexts/management/AdminContext/RegisterContext';
import AdminLogin from './components/login';
import AdminRegister from './components/register';
import AdminDashboard from './components/dashboard';

// Auth Wrapper Component
function AuthWrapper() {
  const { user } = useLogin();
  const [showRegister, setShowRegister] = useState(false);

  // If user is logged in, show dashboard
  if (user) {
    return <AdminDashboard />;
  }

  // If showing register screen
  if (showRegister) {
    return (
      <RegisterProvider>
        <AdminRegister
          onSwitchToLogin={() => setShowRegister(false)}
          onRegisterSuccess={() => {
            // After successful registration, switch to login
            setShowRegister(false);
          }}
        />
      </RegisterProvider>
    );
  }

  // Default: show login
  return <AdminLogin onSwitchToRegister={() => setShowRegister(true)} />;
}

// Main Admin Page Component
export default function AdminPage() {
  return (
    <LoginProvider>
      <AuthWrapper />
    </LoginProvider>
  );
}