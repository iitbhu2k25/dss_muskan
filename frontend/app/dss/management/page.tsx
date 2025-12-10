"use client";

import { useState } from "react";
import Image from "next/image";
import AdminPage from "./components/admin/page";
import EmployeePage from "./components/employee/page";

export default function ManagementPage() {
  const [activePage, setActivePage] = useState<"admin" | "employee" | null>(null);

  // ✅ Common Inner Layout
  const InnerLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 flex flex-col">
      {/* ✅ Top Header */}
      <header className="w-full flex flex-wrap gap-4 items-center justify-between px-4 sm:px-8 py-4 bg-white/80 backdrop-blur shadow-sm">
        {/* ✅ Logo + Buttons */}
        <div className="flex items-center gap-3">
          <Image
            src="/management.png"
            alt="Leaf Logo"
            width={42}
            height={42}
            unoptimized   // ✅ IMPORTANT
            className="rounded-lg"
          />



          <button
            onClick={() => setActivePage(null)}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border bg-white text-gray-700 hover:bg-gray-100 transition"
          >
            ← Back
          </button>

          <button
            onClick={() => setActivePage(null)}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border bg-white text-gray-700 hover:bg-gray-100 transition"
          >
            ⌂ Home
          </button>
        </div>

        <h2 className="text-sm sm:text-lg font-semibold text-gray-800 text-center w-full sm:w-auto">
          {activePage === "admin" ? "Admin Management" : "Employee Management"}
        </h2>
      </header>

      {/* ✅ Main Section */}
      <main className="flex-1 p-3 sm:p-6">{children}</main>
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

  // ✅ Home / Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 flex flex-col items-center justify-center p-6 sm:p-10">

      {/* ✅ Logo */}
      <Image
        src="/management.png"
        alt="Organization Logo"
        width={90}
        height={90}
        className="mb-6 drop-shadow-xl"
      />

      {/* ✅ Heading */}
      <div className="text-center space-y-2 sm:space-y-4 mb-10">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-800">
          Institute Project Staff Management
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Choose your portal to continue
        </p>
      </div>

      {/* ✅ Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">

        {/* ✅ Admin Button */}
        <button
          onClick={() => setActivePage("admin")}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-5 rounded-2xl text-lg sm:text-xl font-semibold
          hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
        >
          Admin Dashboard
        </button>

        {/* ✅ Employee Button */}
        <button
          onClick={() => setActivePage("employee")}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-2xl text-lg sm:text-xl font-semibold
          hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
        >
          Employee Dashboard
        </button>
      </div>
    </div>
  );
}
