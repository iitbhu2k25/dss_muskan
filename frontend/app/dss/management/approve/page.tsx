'use client';

export default function ApprovePage() {
  const handleApprove = () => {
    alert('Approved ✅');
    // Later you can call your API here
  };

  const handleReject = () => {
    alert('Rejected ❌');
    // Later you can call your API here
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100">
      <h1 className="text-2xl font-bold">Supervisor Approval</h1>

      <div className="flex gap-4">
        <button
          onClick={handleApprove}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Approve
        </button>

        <button
          onClick={handleReject}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
