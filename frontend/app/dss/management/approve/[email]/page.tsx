"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ApprovePage() {
  console.log("💡 Component Rendered");

  const params = useParams();
  const rawEmail = params?.email?.toString() || "";
  const encodedEmail = rawEmail;

  const [leaveData, setLeaveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>(""); // 🔥 new state

  // ---------- FETCH LEAVE DETAILS ----------
  useEffect(() => {
    async function fetchData() {
      try {
        const url = `http://localhost:9000/django/management/leave-employee-email-get/${encodedEmail}`;
        const res = await fetch(url);
        const json = await res.json();
        setLeaveData(json?.data?.[0] || null);
      } catch (error) {
        console.log("❌ Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }

    if (encodedEmail) fetchData();
    else setLoading(false);
  }, [encodedEmail]);

  // ---------- APPROVE / REJECT API ----------
  const handleAction = async (status: "approved" | "rejected") => {
    setActionLoading(true);

    try {
      const res = await fetch("http://localhost:9000/django/management/leave-update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leave_id: leaveData.id,
          approval_status: status,
        }),
      });

      const json = await res.json();
      console.log("📦 Update JSON:", json);

      if (res.ok) {
        // 🔥 Set success message
        setSuccessMsg(`Leave ${status} successfully!`);

        // 🔥 Update UI instantly
        setLeaveData((prev: any) => ({
          ...prev,
          approval_status: status,
        }));
      } else {
        alert(json.message || "Failed to update leave");
      }
    } catch (error) {
      console.log("❌ Status Update Error:", error);
      alert("Error updating leave");
    }

    setActionLoading(false);
  };

  if (loading) return <p className="p-10">Loading...</p>;
  if (!leaveData) return <p className="p-10 text-red-500">No leave data found!</p>;

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Leave Approval</h1>

        {/* 🔥 SUCCESS MESSAGE */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-300 rounded">
            {successMsg}
          </div>
        )}

        <div className="space-y-2 text-gray-700">
          <p><strong>Name:</strong> {leaveData.employee_name}</p>
          <p><strong>Email:</strong> {leaveData.employee_email}</p>
          <p><strong>Supervisor:</strong> {leaveData.supervisor_email}</p>
          <p><strong>From:</strong> {leaveData.from_date}</p>
          <p><strong>To:</strong> {leaveData.to_date}</p>
          <p><strong>Total Days:</strong> {leaveData.total_days}</p>
          <p><strong>Type:</strong> {leaveData.leave_type}</p>
          <p><strong>Reason:</strong> {leaveData.reason}</p>
          <p><strong>Status:</strong> {leaveData.approval_status}</p>
        </div>

        {/* 🔥 Hide buttons if already approved/rejected */}
        {leaveData.approval_status === "pending" && !successMsg && (
          <div className="mt-6 flex gap-4">
            <button
              disabled={actionLoading}
              onClick={() => handleAction("approved")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve
            </button>

            <button
              disabled={actionLoading}
              onClick={() => handleAction("rejected")}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
