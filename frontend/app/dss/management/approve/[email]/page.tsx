"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  User, 
  Mail, 
  UserCheck, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  Briefcase,
  CalendarDays
} from "lucide-react";

export default function ApprovePage() {
  console.log("💡 Component Rendered");

  const params = useParams();
  const rawEmail = params?.email?.toString() || "";
  const encodedEmail = rawEmail;

  const [leaveData, setLeaveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>("");

  // ---------- FETCH LEAVE DETAILS ----------
  useEffect(() => {
    async function fetchData() {
      try {
        const url = `/django/management/leave-employee-email-get/${encodedEmail}`;
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
      const res = await fetch("/django/management/leave-update-status", {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full border-2 border-green-300">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">APPROVED</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full border-2 border-red-300">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">REJECTED</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full border-2 border-yellow-300">
            <Clock className="w-5 h-5" />
            <span className="font-bold">PENDING</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading leave details...</p>
        </div>
      </div>
    );
  }

  if (!leaveData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Leave Data Found</h2>
          <p className="text-gray-600">The leave request could not be found or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-10">
      <div className="max-w-3xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Leave Approval Request
            </h1>
            <p className="text-purple-100">Review and approve/reject the leave request below</p>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="mx-6 mt-6 p-4 bg-green-50 text-green-800 border-2 border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Current Status:</span>
              {getStatusBadge(leaveData.approval_status)}
            </div>
          </div>

          {/* Employee Information */}
          <div className="p-6 border-b bg-gradient-to-br from-blue-50 to-purple-50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Employee Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Employee Name
                </p>
                <p className="text-lg font-bold text-gray-800">{leaveData.employee_name}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email Address
                </p>
                <p className="text-sm font-semibold text-gray-800 break-all">{leaveData.employee_email}</p>
              </div>
              {/* ✅ NEW: Position */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  Position
                </p>
                <p className="text-lg font-bold text-blue-800">{leaveData.position || 'N/A'}</p>
              </div>
              {/* ✅ NEW: Joining Date */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Joining Date
                </p>
                <p className="text-lg font-bold text-blue-800">
                  {leaveData.joining_date ? formatDate(leaveData.joining_date) : 'N/A'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200 md:col-span-2">
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Supervisor Email
                </p>
                <p className="text-sm font-semibold text-gray-800 break-all">{leaveData.supervisor_email}</p>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Leave Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <p className="text-xs text-gray-600 font-medium mb-1">From Date</p>
                <p className="text-lg font-bold text-purple-800">{formatDate(leaveData.from_date)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <p className="text-xs text-gray-600 font-medium mb-1">To Date</p>
                <p className="text-lg font-bold text-purple-800">{formatDate(leaveData.to_date)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Total Days</p>
                <p className="text-lg font-bold text-purple-800">{leaveData.total_days} days</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <p className="text-xs text-gray-600 font-medium mb-2">Leave Type</p>
              <p className="text-lg font-bold text-gray-800">{leaveData.leave_type}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 font-medium mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Reason for Leave
              </p>
              <p className="text-gray-800 leading-relaxed">{leaveData.reason}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {leaveData.approval_status === "pending" && !successMsg && (
            <div className="p-6 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Take Action</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction("approved")}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-6 h-6" />
                  {actionLoading ? "Processing..." : "Approve Leave"}
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleAction("rejected")}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="w-6 h-6" />
                  {actionLoading ? "Processing..." : "Reject Leave"}
                </button>
              </div>
            </div>
          )}

          {/* Already Actioned Message */}
          {(leaveData.approval_status !== "pending" || successMsg) && (
            <div className="p-6 bg-gray-50 text-center">
              <p className="text-gray-600 font-medium">
                This leave request has already been {leaveData.approval_status}.
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>Leave Management System • Automated Approval</p>
        </div>
      </div>
    </div>
  );
}