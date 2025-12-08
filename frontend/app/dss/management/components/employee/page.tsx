"use client";

export default function EmployeePage({ goBack }: { goBack: () => void }) {
  return (
    <div className="w-full max-w-3xl bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Employee Management</h2>
      <p className="text-gray-600 mb-6">Employee related operations will come here...</p>

      <button
        onClick={goBack}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Back
      </button>
    </div>
  );
}
