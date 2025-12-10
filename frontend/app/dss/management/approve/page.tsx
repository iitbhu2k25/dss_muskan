'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ApprovePage() {
  const params = useParams();
  const router = useRouter();

  // ✅ Extract & decode email from URL
  const email = decodeURIComponent(params.email as string);

  const [leaveData, setLeaveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  // ✅ Auto fetch on page load
  useEffect(() => {
    if (!email) {
      return;
    }

    fetchLeaveData();
  }, [email]);

  // ✅ ✅ DIRECT CALL TO DJANGO GET API (9000)
  const fetchLeaveData = async () => {
    try {
      const encodedEmail = encodeURIComponent(email);

      console.log('📩 Fetching leave for:', encodedEmail);

      const res = await fetch(
        `http://localhost:9000/django/management/leave-employee-email-get/${encodedEmail}/`
      );

      const data = await res.json();
      console.log('✅ API Response:', data);

      if (!res.ok) {
        setError(data.message || 'No data found');
        setLoading(false);
        return;
      }

      setLeaveData(data.data[0]); // ✅ latest leave
      setStatus(data.data[0].approval_status);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Backend not reachable');
      setLoading(false);
    }
  };

  // ✅ ✅ APPROVE / REJECT API (POST)
  const handleAction = async (action: 'approved' | 'rejected') => {
    setActionLoading(true);

    try {
      const res = await fetch(
        'http://localhost:9000/django/management/leave-update-status',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leave_id: leaveData.id,
            approval_status: action,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Action failed');
        setActionLoading(false);
        return;
      }

      alert(`Leave ${action.toUpperCase()} ✅`);
      setStatus(action);
      setActionLoading(false);
    } catch (err) {
      alert('Server error');
      setActionLoading(false);
    }
  };

  // ✅ LOADING UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Fetching leave data...
      </div>
    );
  }

  // ✅ ERROR UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  // ✅ MAIN UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold text-center mb-4">
          Supervisor Leave Approval
        </h2>

        <div className="space-y-2 text-sm">
          <p><b>Name:</b> {leaveData.employee_name}</p>
          <p><b>Email:</b> {leaveData.employee_email}</p>
          <p><b>From:</b> {leaveData.from_date}</p>
          <p><b>To:</b> {leaveData.to_date}</p>
          <p><b>Total Days:</b> {leaveData.total_days}</p>
          <p><b>Reason:</b> {leaveData.reason}</p>
          <p>
            <b>Status:</b>{' '}
            <span className="font-bold uppercase">{status}</span>
          </p>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => handleAction('approved')}
            disabled={actionLoading || status === 'approved'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            Approve
          </button>

          <button
            onClick={() => handleAction('rejected')}
            disabled={actionLoading || status === 'rejected'}
            className="px-6 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
