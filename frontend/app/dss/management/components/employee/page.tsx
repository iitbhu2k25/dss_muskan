// components/management/employee/page.tsx
'use client';

import { useState } from 'react';
import { LoginProvider, useLogin } from '@/contexts/management/EmployeeContext/LoginContext';
import { RegisterProvider } from '@/contexts/management/EmployeeContext/RegisterContext';
import { LeaveProvider } from '@/contexts/management/EmployeeContext/ApplyLeaveContext';

import EmployeeLogin from './components/login';
import EmployeeRegister from './components/register';
import EmployeeDashboard from './components/dashboard';

// Auth Wrapper Component
function AuthWrapper() {
  const { user, loginWithUserData } = useLogin();
  const [showRegister, setShowRegister] = useState(false);

  // If user is logged in, show dashboard directly
  if (user) {
    return <EmployeeDashboard />;
  }

  // If showing register screen
  if (showRegister) {
    return (
      <RegisterProvider>
        <EmployeeRegister
          onSwitchToLogin={() => setShowRegister(false)}
          onRegisterSuccess={(result) => {
            // result is what RegisterContext `register` returns
            // expected: { success: true, employee: {...}, token: "..." }

            const emp = result.employee;

            // ✅ Shape it like LoginContext's User interface with ALL fields
            const userPayload = {
              id: emp.id,
              name: emp.name,
              email: emp.email,
              username: emp.username,
              department: emp.department,
              supervisor_email: emp.supervisor_email ?? null,
              supervisor_name: emp.supervisor_name ?? null,
              projectName: emp.projectName ?? null,           // backend returns projectName
              joining_date: emp.joining_date ?? null,         // ✅ NEW FIELD
              position: emp.position ?? null,                 // ✅ NEW FIELD
              resign_date: emp.resign_date ?? null,           // ✅ NEW FIELD
              is_active: emp.is_active,
              last_login: emp.created_at ?? null,
              token: result.token ?? undefined,
            };

            loginWithUserData(userPayload);
            setShowRegister(false);
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
      <LeaveProvider>
        <AuthWrapper />
      </LeaveProvider>
    </LoginProvider>
  );
}