import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WorkerSidebar } from '../components/WorkerSidebar';
import { WorkerHeader } from '../components/WorkerHeader';
import { UserAccount } from '../types';
import { getWorkerData, updateJobStatus } from '../services/storage';

interface WorkerJobPageProps {
  currentUser: UserAccount;
  onUserChange?: (user: UserAccount | null) => void;
}

export const WorkerJobPage: React.FC<WorkerJobPageProps> = ({ currentUser, onUserChange }) => {
  const navigate = useNavigate();
  const [worker, setWorker] = useState<UserAccount>(currentUser);
  const [otpInput, setOtpInput] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleSync = () => setTick((t) => t + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('quickhelp_request_update', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('quickhelp_request_update', handleSync);
    };
  }, []);

  const { activeJob } = getWorkerData(worker);

  useEffect(() => {
    if (activeJob?.id) {
      navigate(`/jobs/${activeJob.id}`, { replace: true });
    }
  }, [activeJob?.id, navigate]);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeJob) return;

    const expectedOtp = activeJob.otp || '1234';
    if (otpInput.trim() === expectedOtp) {
      updateJobStatus(activeJob.id, 'completed', { completedDate: 'Today' });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/worker/history');
      }, 2000);
    } else {
      setError(`Invalid OTP code "${otpInput.trim()}". Please enter the exact 4-digit verification code displayed on the customer's screen.`);
    }
  };

  if (!activeJob) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex">
        <WorkerSidebar worker={worker} onWorkerUpdate={(w) => { setWorker(w); if (onUserChange) onUserChange(w); }} />

        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <WorkerHeader worker={worker} onWorkerUpdate={(w) => { setWorker(w); if (onUserChange) onUserChange(w); }} />

          <main className="pt-20 pb-16 px-4 md:px-8 space-y-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <Link
                to="/worker/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006c4c] hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Dashboard</span>
              </Link>
            </div>

            <div className="bg-[#ffffff] rounded-3xl p-10 shadow-sm border border-[#e1e9e5]/80 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#f2f3ff] text-[#006c4c] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">assignment_turned_in</span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                No Active Job in Progress
              </h1>
              <p className="font-['Inter'] text-sm text-[#43474e] max-w-md mx-auto">
                When you accept an incoming request from a customer, you can track transit directions and verify the customer's arrival OTP here.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  to="/worker/requests"
                  className="px-5 py-2.5 bg-[#006c4c] hover:bg-[#005239] text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                  <span>View Incoming Requests</span>
                </Link>
                <Link
                  to="/worker/dashboard"
                  className="px-5 py-2.5 bg-[#f2f3ff] hover:bg-[#e1e9e5] text-[#001f3f] text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const job = activeJob;

  return (
    <div className="min-h-screen bg-[#faf8ff] flex">
      <WorkerSidebar worker={worker} onWorkerUpdate={(w) => { setWorker(w); if (onUserChange) onUserChange(w); }} />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <WorkerHeader worker={worker} onWorkerUpdate={(w) => { setWorker(w); if (onUserChange) onUserChange(w); }} />

        <main className="pt-20 pb-16 px-4 md:px-8 space-y-6 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              to="/worker/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006c4c] hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Dashboard</span>
            </Link>
            <span className="px-3 py-1 bg-[#12345b] text-white text-xs font-bold rounded-full uppercase">
              Active Job #{job.id}
            </span>
          </div>

          {/* Job Overview Card */}
          <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#e1e9e5]/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f2f3ff] pb-5">
              <div>
                <span className="px-2.5 py-0.5 bg-[#7bfac4]/40 text-[#007351] text-xs font-bold rounded-full uppercase tracking-wider">
                  In Progress • En Route
                </span>
                <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f] mt-1.5">
                  {job.serviceTitle}
                </h1>
                <p className="font-['Inter'] text-xs text-[#43474e]">
                  Customer: <strong>{job.customerName}</strong> • {job.transitTime} ({job.distanceKm})
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-[#74777f] uppercase font-semibold block">
                  Guaranteed Payout
                </span>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#006c4c]">
                  ₹{job.guaranteedPayout}
                </span>
                <span className="text-[11px] text-[#007351] block font-medium">
                  Instant escrow settlement
                </span>
              </div>
            </div>

            {/* Destination & Navigation Bar */}
            <div className="bg-[#f2f3ff] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#e1e9e5]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e9edff] text-[#006c4c] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">
                    navigation
                  </span>
                </div>
                <div>
                  <span className="block font-['Inter'] text-xs font-semibold text-[#0d1b36]">
                    {job.address}
                  </span>
                  <span className="block font-['Inter'] text-[11px] text-[#74777f]">
                    Household landmark: Near Jain Temple
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${job.customerPhone}`}
                  className="px-4 py-2 bg-[#006c4c] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-[#003b2a]"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Call {job.customerName?.split(' ')[0]}</span>
                </a>
              </div>
            </div>

            {/* Customer Work Notes */}
            <div className="space-y-2">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f]">
                Customer Notes & Diagnostics
              </h3>
              <p className="font-['Inter'] text-xs text-[#43474e] bg-[#faf8ff] p-4 rounded-xl border border-[#e1e9e5] leading-relaxed">
                "{job.description}"
              </p>
            </div>

            {/* OTP Completion Form */}
            <div className="bg-[#12345b] text-white p-6 sm:p-7 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7bfac4] text-[20px]">
                  key
                </span>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-white">
                  Customer Arrival OTP Handoff
                </h3>
              </div>

              <p className="font-['Inter'] text-xs text-[#d9e2ff] leading-relaxed">
                Ask {job.customerName?.split(' ')[0]} for their 4-digit security code upon arrival. Entering this code verifies completion and triggers instant release of ₹{job.guaranteedPayout}.
              </p>

              {error && (
                <div className="p-3 bg-[#ba1a1a] text-white text-xs font-semibold rounded-xl">
                  {error}
                </div>
              )}

              {isSuccess ? (
                <div className="p-4 bg-[#006c4c] text-white rounded-2xl text-center space-y-1 animate-in zoom-in-95">
                  <div className="font-['Plus_Jakarta_Sans'] font-bold text-lg">
                    ✓ OTP Verified! ₹{job.guaranteedPayout} Settled
                  </div>
                  <p className="font-['Inter'] text-xs text-[#7bfac4]">
                    Payment deposited into your wallet. Redirecting to schedule history...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 4-Digit Code (e.g. 4829)"
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-mono text-center tracking-[0.2em] font-bold text-lg border border-white/20 outline-none focus:border-[#7bfac4] placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-white/60"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#7bfac4] hover:bg-[#5ddda9] text-[#002114] font-['Inter'] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Verify & Complete Job</span>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
