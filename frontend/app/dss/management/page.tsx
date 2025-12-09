"use client";

import { useState } from "react";
import AdminPage from "./components/admin/page";
import EmployeePage from "./components/employee/page";

export default function ManagementPage() {
  const [activePage, setActivePage] = useState<"admin" | "employee" | null>(null);

  // Top bar shown only when inside admin/employee
  const InnerLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 flex flex-col">
      <header className="w-full flex items-center justify-between px-6 py-4 bg-white/80 shadow-sm">
        <div className="flex gap-3">
          {/* Back: only logical back inside this page */}
          <button
            onClick={() => setActivePage(null)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
          >
            ← Back
          </button>

          {/* Home: same as selection screen (admin/employee options) */}
          <button
            onClick={() => setActivePage(null)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
          >
            ⌂ Home
          </button>
        </div>

        <h2 className="text-lg font-semibold text-gray-800">
          {activePage === "admin" ? "Admin Management" : "Employee Management"}
        </h2>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );

  if (activePage === "admin") {
    return (
      <InnerLayout>
        <AdminPage />
      </InnerLayout>
    );
  }

  if (activePage === "employee") {
    return (
      <InnerLayout>
        <EmployeePage />
      </InnerLayout>
    );
  }

  // Home/selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-2">Management Dashboard</h1>
        <p className="text-gray-600 text-lg">Choose your portal to continue</p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-md">
        <button
          onClick={() => setActivePage("admin")}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-5 rounded-xl text-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
        >
          Admin Management
        </button>

        <button
          onClick={() => setActivePage("employee")}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
        >
          Employee Management
        </button>
      </div>
    </div>
  );
}
