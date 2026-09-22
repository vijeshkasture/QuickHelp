import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { UserAccount, Job } from '../types';
import { getCustomerJobs, updateJobStatus } from '../services/storage';

interface CustomerLiveTrackPageProps {
  currentUser: UserAccount;
  onUserChange?: (user: UserAccount | null) => void;
}

export const CustomerLiveTrackPage: React.FC<CustomerLiveTrackPageProps> = ({
  currentUser,
  onUserChange,
}) => {
  const navigate = useNavigate();
  const [jobState, setJobState] = useState<Job | null>(() => getCustomerJobs(currentUser).activeJob);
  const [step, setStep] = useState<'transit' | 'arrived' | 'completed'>('transit');
  const [userRating, setUserRating] = useState(5);
  const [feedback, setFeedback] = useState('Punctual and resolved the issue quickly!');
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // Sync real-time updates when worker accepts or rejects
  useEffect(() => {
    const handleUpdate = () => {
      const { activeJob } = getCustomerJobs(currentUser);
      setJobState(activeJob);
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('quickhelp_request_update', handleUpdate);
    const interval = setInterval(handleUpdate, 1500);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('quickhelp_request_update', handleUpdate);
      clearInterval(interval);
    };
  }, [currentUser]);

  useEffect(() => {
    if (jobState?.id) {
      navigate(`/jobs/${jobState.id}`, { replace: true });
    }
  }, [jobState?.id, navigate]);

  const handleSimulateArrival = () => {
    setStep('arrived');
  };

  const handleCancelRequest = () => {
    if (!jobState) return;
    updateJobStatus(jobState.id, 'cancelled');
    setJobState(null);
    navigate('/customer/dashboard');
  };

  const handleCompleteJob = () => {
    if (!jobState) return;
    setCompletedSuccess(true);
    updateJobStatus(jobState.id, 'completed', {
      completedDate: 'Today',
      ratingGiven: userRating,
    });

    setTimeout(() => {
      navigate('/customer/history');
    }, 2000);
  };

  if (!jobState) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col">
        <Header currentUser={currentUser} onUserChange={onUserChange} />
        <main className="w-full pt-28 pb-16 flex-1 max-w-lg mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#f2f3ff] text-[#74777f] mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">schedule</span>
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
            No Active Requests
          </h2>
          <p className="font-['Inter'] text-xs sm:text-sm text-[#43474e]">
            You do not currently have any pending or ongoing service dispatches.
          </p>
          <div className="pt-2">
            <Link
              to="/customer/dashboard"
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#006c4c] hover:bg-[#003b2a] text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <span>Find a Worker</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <Header currentUser={currentUser} onUserChange={onUserChange} />

      <main className="w-full pt-20 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/customer/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006c4c] hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Dashboard</span>
            </Link>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                jobState.status === 'pending'
                  ? 'bg-[#d4e3ff] text-[#001c3a]'
                  : jobState.status === 'rejected'
                  ? 'bg-[#ffdad6] text-[#93000a]'
                  : 'bg-[#12345b] text-white'
              }`}
            >
              Status: {jobState.status} #{jobState.id}
            </span>
          </div>

          {/* PENDING STATE CARD */}
          {jobState.status === 'pending' && (
            <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 border-2 border-[#12345b]/20 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#006c4c] animate-ping" />
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#001f3f]">
                  Request Pending Worker Response
                </h2>
              </div>

              <p className="font-['Inter'] text-xs sm:text-sm text-[#43474e] leading-relaxed">
                Your request has been dispatched to <strong>{jobState.workerName || 'the assigned technician'}</strong>. Waiting for their confirmation to begin transit.
              </p>

              <div className="p-4 bg-[#f2f3ff] rounded-2xl border border-[#e1e9e5] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#74777f]">Service:</span>
                  <span className="font-semibold text-[#0d1b36]">{jobState.serviceTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#74777f]">Location:</span>
                  <span className="font-semibold text-[#0d1b36]">{jobState.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#74777f]">Offered Payout:</span>
                  <span className="font-bold text-[#006c4c]">₹{jobState.offeredPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#74777f]">Description:</span>
                  <span className="text-[#0d1b36] text-right max-w-xs">{jobState.description}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#74777f]">
                  Expected response within 2-3 minutes
                </span>
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  className="px-4 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl transition-colors"
                >
                  Cancel Request
                </button>
              </div>
            </div>
          )}

          {/* REJECTED STATE CARD */}
          {jobState.status === 'rejected' && (
            <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 border border-[#ffdad6] shadow-sm space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#001f3f]">
                Request Declined
              </h2>
              <p className="font-['Inter'] text-xs sm:text-sm text-[#43474e] max-w-md mx-auto">
                <strong>{jobState.workerName || 'The worker'}</strong> was unable to accept your request at this time. You can choose another nearby technician.
              </p>
              <div className="pt-2">
                <Link
                  to={`/customer/matching?service=${encodeURIComponent(jobState.serviceCategory)}`}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#006c4c] text-white text-xs font-semibold rounded-xl hover:bg-[#003b2a] transition-all"
                >
                  <span>Select Another Worker</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          )}

          {/* ACCEPTED / DISPATCHED / IN PROGRESS STATE */}
          {(jobState.status === 'accepted' ||
            jobState.status === 'dispatched' ||
            jobState.status === 'in_progress') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Map View & Progress Timeline */}
              <div className="lg:col-span-7 space-y-4">
                {/* Map Canvas Simulation */}
                <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-[#e9edff] border border-[#e1e9e5] relative shadow-sm">
                  <svg className="w-full h-full opacity-60" viewBox="0 0 400 300">
                    <path
                      d="M0 100 L400 120 M120 0 L140 300 M280 0 L260 300 M0 220 L400 200"
                      stroke="#ffffff"
                      strokeWidth="8"
                    />
                    <path
                      d="M50 50 L120 100 L260 120 L270 200 L350 250"
                      stroke="#006c4c"
                      strokeWidth="5"
                      strokeDasharray="6,4"
                      fill="none"
                    />
                    <rect x="180" y="40" width="70" height="40" rx="6" fill="#ffffff" opacity="0.8" />
                    <text x="185" y="65" fontSize="10" fill="#12345b" fontWeight="bold">
                      Freeganj
                    </text>
                    <rect x="230" y="160" width="80" height="30" rx="6" fill="#ffffff" opacity="0.8" />
                    <text x="235" y="180" fontSize="10" fill="#12345b" fontWeight="bold">
                      Prem Nagar
                    </text>
                  </svg>

                  {/* Worker Moving Location Marker */}
                  <div className="absolute top-[42%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="px-2 py-0.5 bg-[#006c4c] text-white text-[10px] font-bold rounded-full mb-1 shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">two_wheeler</span>
                      <span>{jobState.workerName || 'Worker'} ({jobState.transitTime || '~10 min'})</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#006c4c] text-white flex items-center justify-center ring-4 ring-white shadow-lg animate-bounce">
                      <span className="material-symbols-outlined text-[16px]">navigation</span>
                    </div>
                  </div>

                  {/* Customer Home Pin */}
                  <div className="absolute top-[68%] left-[72%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#12345b] text-white flex items-center justify-center ring-4 ring-white shadow-lg">
                      <span className="material-symbols-outlined text-[16px]">home</span>
                    </div>
                    <span className="text-[10px] font-bold bg-[#ffffff] px-2 py-0.5 rounded shadow mt-1 text-[#001f3f]">
                      Your Location
                    </span>
                  </div>

                  {/* Live ETA Floating Banner */}
                  <div className="absolute bottom-4 left-4 right-4 bg-[#ffffff]/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-[#e1e9e5] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#7bfac4] text-[#002114] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">timer</span>
                      </div>
                      <div>
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f]">
                          {step === 'transit' ? 'Arriving in ~8-12 minutes' : 'Technician at Doorstep'}
                        </span>
                        <span className="block font-['Inter'] text-xs text-[#43474e]">
                          {step === 'transit' ? 'On route with equipment' : 'Inspection in progress'}
                        </span>
                      </div>
                    </div>

                    {step === 'transit' && (
                      <button
                        onClick={handleSimulateArrival}
                        className="px-3 py-1.5 bg-[#f2f3ff] hover:bg-[#e9edff] text-[#006c4c] text-xs font-semibold rounded-lg border border-[#006c4c]/20"
                      >
                        Simulate Arrival
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Worker Card, OTP & Settlement */}
              <div className="lg:col-span-5 space-y-4">
                {/* Worker Identity Card */}
                <div className="bg-[#ffffff] p-6 rounded-3xl shadow-sm border border-[#e1e9e5]/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-[#7bfac4]/30 text-[#007351] font-['Inter'] text-xs font-semibold rounded-full">
                      Accepted Partner
                    </span>
                    <span className="text-xs font-bold text-[#006c4c] flex items-center gap-0.5">
                      ★ {jobState.workerRating || 5.0}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      alt={jobState.workerName || 'Worker'}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#006c4c]"
                      src={
                        jobState.workerAvatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          jobState.workerName || 'Worker'
                        )}&background=006c4c&color=ffffff`
                      }
                    />
                    <div>
                      <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f]">
                        {jobState.workerName || 'Assigned Technician'}
                      </h3>
                      <p className="font-['Inter'] text-xs text-[#43474e]">
                        {jobState.workerTrade || 'Certified Technician'}
                      </p>
                      <span className="text-[11px] text-[#74777f] font-mono block mt-0.5">
                        {jobState.workerPhone || '+91 98765 43210'}
                      </span>
                    </div>
                  </div>

                  {/* Arrival Handoff OTP */}
                  <div className="p-4 bg-[#f2f3ff] rounded-2xl border border-[#d9e2ff] text-center space-y-1">
                    <span className="font-['Inter'] text-[11px] font-semibold text-[#43474e] uppercase tracking-wider block">
                      Arrival Verification OTP
                    </span>
                    <span className="font-mono font-bold text-3xl text-[#001f3f] tracking-widest block">
                      {jobState.otp || '4829'}
                    </span>
                    <span className="font-['Inter'] text-[10px] text-[#74777f] block">
                      Share this code with {jobState.workerName} upon arrival to verify handoff
                    </span>
                  </div>
                </div>

                {/* Completion Box */}
                {step === 'arrived' && (
                  <div className="bg-[#ffffff] p-6 rounded-3xl border-2 border-[#006c4c] space-y-4">
                    <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                      Rate & Complete Job
                    </h4>
                    <p className="font-['Inter'] text-xs text-[#43474e]">
                      Inspection finished. Confirm satisfaction and rate {jobState.workerName}:
                    </p>

                    <div className="flex items-center gap-2 justify-center py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className={`text-2xl transition-transform hover:scale-110 ${
                            star <= userRating ? 'text-[#e2a03f]' : 'text-[#c3c6cf]'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add review feedback..."
                      className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs font-['Inter'] text-[#0d1b36] outline-none border border-transparent focus:border-[#006c4c]"
                    />

                    <button
                      onClick={handleCompleteJob}
                      disabled={completedSuccess}
                      className="w-full py-3 bg-[#006c4c] hover:bg-[#003b2a] text-white font-['Inter'] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>
                        {completedSuccess ? 'Job Completed & Settled!' : 'Confirm & Release ₹' + jobState.offeredPrice}
                      </span>
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
