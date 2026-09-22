import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WorkerHeader } from '../components/WorkerHeader';
import { WorkerSidebar } from '../components/WorkerSidebar';
import { JobChat } from '../components/JobChat';
import { UserAccount, Job } from '../types';
import {
  getSecureJobById,
  acceptWorkerRequest,
  rejectWorkerRequest,
  startWorkJob,
  completeWorkJob,
  cancelJob,
  submitJobReview,
} from '../services/storage';

interface SecureJobRoomPageProps {
  currentUser: UserAccount | null;
  onUserChange?: (user: UserAccount | null) => void;
}

export const SecureJobRoomPage: React.FC<SecureJobRoomPageProps> = ({
  currentUser,
  onUserChange,
}) => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Worker OTP input
  const [otpInput, setOtpInput] = useState('');

  // Cancel dialog
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of schedule / plan');

  // Customer Review form
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const fetchJob = () => {
    if (!jobId) {
      setAccessError('Invalid job identifier.');
      return;
    }

    const res = getSecureJobById(jobId);
    if (!res.success) {
      setAccessError(res.error || 'Access Denied.');
      setJob(null);
    } else {
      setAccessError(null);
      setJob((prev) => {
        if (prev && res.job && JSON.stringify(prev) === JSON.stringify(res.job)) {
          return prev;
        }
        return res.job || null;
      });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [jobId]);

  useEffect(() => {
    fetchJob();

    const handleSync = () => {
      fetchJob();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('quickhelp_request_update', handleSync);
    const interval = setInterval(fetchJob, 1500);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('quickhelp_request_update', handleSync);
      clearInterval(interval);
    };
  }, [jobId]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col items-center justify-center p-4">
        <div className="bg-[#ffffff] p-8 rounded-3xl shadow-sm border border-[#e1e9e5] max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
            Authentication Required
          </h2>
          <p className="font-['Inter'] text-xs sm:text-sm text-[#43474e]">
            You must be logged in as a registered customer or technician to access this private job room.
          </p>
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#006c4c] text-white rounded-xl font-bold text-xs shadow-sm hover:bg-[#003b2a]"
          >
            <span>Log In to Account</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  // 403 Security Check / URL Tampering Prevention
  if (accessError || !job) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col items-center justify-center p-4">
        <div className="bg-[#ffffff] p-8 sm:p-10 rounded-3xl shadow-md border-2 border-[#ba1a1a]/30 max-w-lg w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
          </div>
          <div className="inline-block px-3 py-1 bg-[#ffdad6] text-[#93000a] text-xs font-bold rounded-full uppercase tracking-wider">
            Security Notice • 403 Forbidden
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
            Access Denied
          </h2>
          <p className="font-['Inter'] text-xs sm:text-sm text-[#43474e] leading-relaxed">
            {accessError || 'You are not an authorized participant in this job session. Job rooms and contact information are strictly restricted to the assigned customer and technician.'}
          </p>
          <div className="pt-3 flex justify-center gap-3">
            <Link
              to={currentUser.role === 'customer' ? '/customer/dashboard' : '/worker/dashboard'}
              className="px-6 py-3 bg-[#006c4c] hover:bg-[#003b2a] text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Return to My Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCustomer = currentUser.role === 'customer';
  const isWorker = currentUser.role === 'worker';
  const partnerName = isCustomer ? (job.workerName || 'Assigned Worker') : job.customerName;
  const partnerRole = isCustomer ? 'Technician' : 'Household';

  // State machine handlers
  const handleAccept = () => {
    setActionError(null);
    const res = acceptWorkerRequest(job.id);
    if (!res.success) {
      setActionError(res.error || 'Failed to accept request.');
    } else {
      setActionSuccess('You have accepted the request! Head to the customer destination.');
      fetchJob();
    }
  };

  const handleDecline = () => {
    setActionError(null);
    const res = rejectWorkerRequest(job.id);
    if (!res.success) {
      setActionError(res.error || 'Failed to decline request.');
    } else {
      navigate('/worker/requests');
    }
  };

  const handleStartWork = () => {
    setActionError(null);
    const res = startWorkJob(job.id);
    if (!res.success) {
      setActionError(res.error || 'Failed to start work.');
    } else {
      setActionSuccess('Job marked as In Progress. Perform repair work.');
      fetchJob();
    }
  };

  const handleCompleteOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const res = completeWorkJob(job.id, otpInput);
    if (!res.success) {
      setActionError(res.error || 'Invalid OTP code.');
    } else {
      setActionSuccess(`✓ OTP Verified! ₹${job.guaranteedPayout} settled into your wallet.`);
      fetchJob();
    }
  };

  const handleCancelSubmit = () => {
    const res = cancelJob(job.id, cancelReason);
    if (!res.success) {
      setActionError(res.error || 'Failed to cancel job.');
    } else {
      setShowCancelModal(false);
      fetchJob();
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const res = submitJobReview(job.id, ratingInput, reviewComment);
    if (!res.success) {
      setActionError(res.error || 'Failed to submit review.');
    } else {
      setReviewSubmitted(true);
      fetchJob();
    }
  };

  const content = (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          to={isCustomer ? '/customer/dashboard' : '/worker/dashboard'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006c4c] hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#12345b] text-white text-xs font-bold rounded-full uppercase tracking-wider">
            Job #{job.id}
          </span>
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
              job.status === 'pending'
                ? 'bg-[#d4e3ff] text-[#001c3a]'
                : job.status === 'accepted'
                ? 'bg-[#7bfac4] text-[#002114]'
                : job.status === 'in_progress'
                ? 'bg-[#ffdcc1] text-[#6b2f00]'
                : job.status === 'completed'
                ? 'bg-[#006c4c] text-white'
                : 'bg-[#ffdad6] text-[#93000a]'
            }`}
          >
            {job.status === 'in_progress' ? 'In Progress' : job.status}
          </span>
        </div>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="p-4 bg-[#ffdad6] text-[#93000a] text-xs font-bold rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)}>✕</button>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-[#7bfac4] text-[#002114] text-xs font-bold rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)}>✕</button>
        </div>
      )}

      {/* Primary Job Overview Card */}
      <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#e1e9e5]/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f2f3ff] pb-5">
          <div>
            <span className="px-2.5 py-0.5 bg-[#f2f3ff] text-[#12345b] text-[11px] font-bold rounded-full uppercase">
              {job.serviceCategory} • Cash / Direct UPI on Delivery
            </span>
            <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f] mt-1.5">
              {job.serviceTitle}
            </h1>
            <p className="font-['Inter'] text-xs text-[#43474e]">
              Partner: <strong>{partnerName}</strong> ({partnerRole})
            </p>
          </div>

          <div className="text-left sm:text-right">
            {isCustomer ? (
              <>
                <span className="text-xs text-[#74777f] uppercase font-semibold block">
                  Direct Cash/UPI to Worker
                </span>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#006c4c]">
                  ₹{job.offeredPrice}
                </span>
                <span className="text-[11px] text-[#006c4c] block font-bold">
                  0% Customer Platform Fee
                </span>
              </>
            ) : (
              <>
                <span className="text-xs text-[#74777f] uppercase font-semibold block">
                  Collect Cash from Customer
                </span>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#001f3f]">
                  ₹{job.offeredPrice}
                </span>
                <span className="text-[11px] text-[#006c4c] block font-semibold">
                  Net (90%): ₹{Math.round(job.offeredPrice * 0.9)} • App Fee (10%): ₹{Math.round(job.offeredPrice * 0.1)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Dynamic State Lifecycle Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-[#74777f] uppercase tracking-wider">
            <span className={job.status === 'pending' || job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed' ? 'text-[#006c4c]' : ''}>
              1. Request Sent
            </span>
            <span className={job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed' ? 'text-[#006c4c]' : ''}>
              2. Accepted
            </span>
            <span className={job.status === 'in_progress' || job.status === 'completed' ? 'text-[#006c4c]' : ''}>
              3. Work Started
            </span>
            <span className={job.status === 'completed' ? 'text-[#006c4c]' : ''}>
              4. Completed
            </span>
          </div>
          <div className="w-full h-2 bg-[#f2f3ff] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#006c4c] transition-all duration-500"
              style={{
                width:
                  job.status === 'pending'
                    ? '25%'
                    : job.status === 'accepted'
                    ? '50%'
                    : job.status === 'in_progress'
                    ? '75%'
                    : job.status === 'completed'
                    ? '100%'
                    : '100%',
                backgroundColor: job.status === 'cancelled' || job.status === 'rejected' ? '#ba1a1a' : '#006c4c',
              }}
            />
          </div>
        </div>

        {/* Location & Contact Privacy Card */}
        <div className="bg-[#f2f3ff] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#e1e9e5]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e9edff] text-[#006c4c] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">location_on</span>
            </div>
            <div>
              <span className="block font-['Inter'] text-xs font-semibold text-[#0d1b36]">
                {job.status === 'pending' && isWorker
                  ? `${job.neighborhood} (Exact street revealed upon acceptance)`
                  : job.address}
              </span>
              <span className="block font-['Inter'] text-[11px] text-[#74777f]">
                {job.neighborhood} • {job.distanceKm}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.status === 'pending' ? (
              <span className="px-3 py-1.5 bg-[#e1e9e5] text-[#43474e] rounded-xl text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span>Contact Masked Prior to Acceptance</span>
              </span>
            ) : (
              <a
                href={`tel:${isCustomer ? job.workerPhone : job.customerPhone}`}
                className="px-4 py-2 bg-[#006c4c] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-[#003b2a] shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>Call {partnerName.split(' ')[0]}</span>
              </a>
            )}
          </div>
        </div>

        {/* Customer Diagnostic Notes */}
        <div className="space-y-1.5">
          <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-xs text-[#001f3f] uppercase tracking-wider">
            Work Description & Notes
          </h3>
          <p className="font-['Inter'] text-xs text-[#43474e] bg-[#faf8ff] p-4 rounded-xl border border-[#e1e9e5] leading-relaxed">
            "{job.description}"
          </p>
        </div>

        {/* Controlled Lifecycle Actions */}
        {/* Case 1: PENDING */}
        {job.status === 'pending' && (
          <div className="p-5 bg-[#d4e3ff]/40 rounded-2xl border border-[#d4e3ff] space-y-3">
            <div className="flex items-center gap-2 text-[#001c3a]">
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm">
                {isWorker ? 'Incoming Request Waiting for Your Decision' : 'Request Sent • Awaiting Worker Response'}
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#43474e]">
              {isWorker
                ? 'Review the requirements above. Accepting reserves the dispatch and unlocks the exact destination address.'
                : `We notified ${job.workerName}. You can cancel anytime before acceptance.`}
            </p>

            <div className="flex items-center gap-3 pt-1">
              {isWorker ? (
                <>
                  <button
                    onClick={handleAccept}
                    className="px-6 py-2.5 bg-[#006c4c] hover:bg-[#003b2a] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    Accept Work Request
                  </button>
                  <button
                    onClick={handleDecline}
                    className="px-4 py-2.5 bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#93000a] text-xs font-bold rounded-xl transition-all"
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#93000a] text-xs font-bold rounded-xl transition-all"
                >
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        )}

        {/* Case 2: ACCEPTED */}
        {job.status === 'accepted' && (
          <div className="p-5 bg-[#7bfac4]/20 rounded-2xl border border-[#7bfac4]/60 space-y-3">
            <div className="flex items-center gap-2 text-[#002114]">
              <span className="material-symbols-outlined text-[20px] text-[#006c4c]">check_circle</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm">
                {isWorker ? 'Job Accepted • En Route to Customer' : `${job.workerName} Accepted Your Request!`}
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#43474e]">
              {isWorker
                ? 'When you arrive at the customer location and are ready to commence the diagnostic/repair, click "Start Work".'
                : 'Technician is en route. Use the private chat below to coordinate arrival.'}
            </p>
            <div className="flex items-center gap-3 pt-1">
              {isWorker && (
                <button
                  onClick={handleStartWork}
                  className="px-6 py-2.5 bg-[#006c4c] hover:bg-[#003b2a] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <span>Start Work</span>
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                </button>
              )}
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 bg-[#ffffff] border border-[#ba1a1a] text-[#ba1a1a] text-xs font-bold rounded-xl hover:bg-[#ffdad6]/30 transition-all"
              >
                Cancel Job
              </button>
            </div>
          </div>
        )}

        {/* Case 3: IN PROGRESS */}
        {job.status === 'in_progress' && (
          <div className="p-6 bg-[#12345b] text-white rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7bfac4] text-[22px]">engineering</span>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-white">
                  Work in Progress
                </span>
              </div>
              <span className="px-3 py-1 bg-white/10 text-[#7bfac4] rounded-full text-xs font-bold font-mono">
                Active Session
              </span>
            </div>

            {isCustomer ? (
              <div className="p-4 bg-white/10 rounded-2xl space-y-2 border border-white/20">
                <div className="text-xs text-[#d9e2ff]">
                  Worker has started the service. Share this 4-digit arrival security code with {job.workerName} to verify completion and release payout:
                </div>
                <div className="font-mono text-3xl font-extrabold text-[#7bfac4] tracking-[0.3em] text-center py-2">
                  {job.otp}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-['Inter'] text-xs text-[#d9e2ff]">
                  Upon finishing repairs, request the 4-digit security code from {job.customerName} to finalize completion and release ₹{job.guaranteedPayout} to your wallet.
                </p>
                <form onSubmit={handleCompleteOtp} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 4-digit code"
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-mono text-center tracking-[0.2em] font-bold text-lg border border-white/20 outline-none focus:border-[#7bfac4] placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#7bfac4] hover:bg-[#5ddda9] text-[#002114] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Verify & Complete Work</span>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Case 4: COMPLETED & REVIEWS */}
        {job.status === 'completed' && (
          <div className="p-6 bg-[#f2f3ff] rounded-3xl border border-[#e1e9e5] space-y-4">
            <div className="flex items-center gap-2 text-[#006c4c]">
              <span className="material-symbols-outlined text-[24px]">verified</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-base">
                Service Completed & Settled
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#43474e]">
              Completed on {job.completedDate || 'Today'}. Total fee of ₹{job.guaranteedPayout || job.offeredPrice} released via secure escrow.
            </p>

            {/* Customer Review Section */}
            {isCustomer && (
              <div className="pt-2 border-t border-[#e1e9e5]">
                {job.ratingGiven || reviewSubmitted ? (
                  <div className="p-4 bg-[#ffffff] rounded-2xl border border-[#e1e9e5] space-y-1">
                    <div className="flex items-center gap-1 text-[#006c4c]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined text-[18px]">
                          {s <= (job.ratingGiven || ratingInput) ? 'star' : 'star_border'}
                        </span>
                      ))}
                      <span className="text-xs font-bold ml-2">Verified Customer Review</span>
                    </div>
                    {job.reviewComment && (
                      <p className="font-['Inter'] text-xs text-[#43474e] italic">
                        "{job.reviewComment}"
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="bg-[#ffffff] p-5 rounded-2xl border border-[#e1e9e5] space-y-3">
                    <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f]">
                      Rate Your Experience with {job.workerName}
                    </h4>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          className="text-[#006c4c] focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-[28px]">
                            {star <= ratingInput ? 'star' : 'star_border'}
                          </span>
                        </button>
                      ))}
                      <span className="font-['Inter'] text-xs font-bold text-[#006c4c] ml-2">
                        {ratingInput} out of 5 Stars
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share quick feedback on timeliness, tool skill, and professionalism..."
                      className="w-full p-3 bg-[#faf8ff] border border-[#e1e9e5] rounded-xl text-xs font-['Inter'] text-[#0d1b36] outline-none focus:border-[#006c4c]"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#006c4c] hover:bg-[#003b2a] text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Submit Review
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Case 5: CANCELLED / REJECTED */}
        {(job.status === 'cancelled' || job.status === 'rejected') && (
          <div className="p-5 bg-[#ffdad6]/50 rounded-2xl border border-[#ffdad6] space-y-2">
            <div className="flex items-center gap-2 text-[#93000a]">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm">
                Job Session {job.status === 'rejected' ? 'Declined' : 'Cancelled'}
              </span>
            </div>
            <p className="font-['Inter'] text-xs text-[#43474e]">
              Reason: <strong>{job.cancellationReason || 'Closed by user'}</strong> ({job.cancelledBy ? `by ${job.cancelledBy}` : ''})
            </p>
          </div>
        )}
      </div>

      {/* Private In-App Chat Room */}
      <div className="space-y-2">
        <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f]">
          Secure In-App Chat
        </h3>
        <JobChat
          jobId={job.id}
          currentUser={currentUser}
          jobStatus={job.status}
          partnerName={partnerName}
          partnerRole={partnerRole}
        />
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f]">
                Cancel Service Job
              </h3>
              <button onClick={() => setShowCancelModal(false)}>
                <span className="material-symbols-outlined text-[#74777f]">close</span>
              </button>
            </div>
            <p className="font-['Inter'] text-xs text-[#43474e]">
              Please select a cancellation reason for our platform quality audit:
            </p>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 bg-[#f2f3ff] rounded-xl text-xs font-['Inter'] border border-[#e1e9e5] outline-none"
            >
              <option value="Change of schedule / plan">Change of schedule / plan</option>
              <option value="Issue resolved independently">Issue resolved independently</option>
              <option value="Booked another technician">Booked another technician</option>
              <option value="Pricing disagreement">Pricing disagreement</option>
              <option value="Other">Other reason</option>
            </select>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-[#f2f3ff] text-xs font-semibold rounded-xl"
              >
                Keep Job Active
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                className="px-5 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Return with appropriate navigation shell
  if (isWorker) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex">
        <WorkerSidebar worker={currentUser} onWorkerUpdate={(w) => { if (onUserChange) onUserChange(w); }} />
        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <WorkerHeader worker={currentUser} onWorkerUpdate={(w) => { if (onUserChange) onUserChange(w); }} />
          <main className="pt-20 pb-16">{content}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <Header currentUser={currentUser} onUserChange={onUserChange} />
      <main className="pt-20 pb-16 flex-1">{content}</main>
      <Footer />
    </div>
  );
};
