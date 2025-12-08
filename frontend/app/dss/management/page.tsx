"use client";

import { useState } from "react";
import AdminPage from "./components/admin/page";
import EmployeePage from "./components/employee/page";

export default function ManagementPage() {
  const [activePage, setActivePage] = useState<"admin" | "employee" | null>(null);

  // If a page is active, render it without the main container
  if (activePage === "admin") {
    return <AdminPage />;
  }

  if (activePage === "employee") {
    //return <EmployeePage/>;
  }

  // Default: Show selection screen
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