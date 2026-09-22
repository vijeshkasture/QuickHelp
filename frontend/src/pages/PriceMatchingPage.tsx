import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { UserAccount, Job } from '../types';
import { getAllRegisteredWorkers, createCustomerRequest } from '../services/storage';

interface PriceMatchingPageProps {
  currentUser: UserAccount;
  onUserChange?: (user: UserAccount | null) => void;
}

export const PriceMatchingPage: React.FC<PriceMatchingPageProps> = ({
  currentUser,
  onUserChange,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get('service') || 'Electrician';

  const benchmarkPrice = 300;
  const [offeredPrice, setOfferedPrice] = useState<number>(500);
  const [workers, setWorkers] = useState<UserAccount[]>(() => getAllRegisteredWorkers());
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [requestSentJob, setRequestSentJob] = useState<Job | null>(null);
  const [error, setError] = useState<string>('');

  const [description, setDescription] = useState(
    'Living room ceiling light fitting sparked and stopped turning on. Switchboard is normal, need a quick diagnostic and repair.'
  );
  const [address, setAddress] = useState(
    currentUser.address || currentUser.defaultLocation || 'Freeganj, Ujjain, MP'
  );

  // Keep workers list fresh
  useEffect(() => {
    const refreshWorkers = () => {
      setWorkers(getAllRegisteredWorkers());
    };
    refreshWorkers();
    window.addEventListener('storage', refreshWorkers);
    return () => window.removeEventListener('storage', refreshWorkers);
  }, []);

  // Filter or prioritize workers matching the selected trade
  const matchingWorkers = workers.filter(
    (w) =>
      !w.primaryTrade ||
      w.primaryTrade.toLowerCase().includes(serviceParam.toLowerCase()) ||
      serviceParam.toLowerCase().includes((w.primaryTrade || '').toLowerCase())
  );
  const displayWorkers = matchingWorkers.length > 0 ? matchingWorkers : workers;

  // Auto-select first worker if available and none selected
  useEffect(() => {
    if (displayWorkers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(displayWorkers[0].id);
    }
  }, [displayWorkers, selectedWorkerId]);

  const handleAdjustPrice = (delta: number) => {
    setOfferedPrice((prev) => Math.max(250, Math.min(1000, prev + delta)));
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedWorkerId) {
      setError('Please select a worker to send your request to.');
      return;
    }

    if (!description.trim()) {
      setError('Please describe the work needed.');
      return;
    }

    if (!address.trim()) {
      setError('Please provide your service location/address.');
      return;
    }

    const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
    if (!selectedWorker) {
      setError('Selected worker profile is not available. Please pick another worker.');
      return;
    }

    // Create real persistent request linking customer and worker
    const res = createCustomerRequest({
      workerId: selectedWorker.id,
      serviceCategory: serviceParam,
      serviceTitle: `${serviceParam} Diagnostic & Repair`,
      description: description.trim(),
      address: address.trim(),
      neighborhood: currentUser.defaultLocation || address.trim(),
      benchmarkPrice,
      offeredPrice,
      distanceKm: `${selectedWorker.dispatchRadius || 3} km zone`,
      transitTime: '~10-15 min',
    });

    if (!res.success || !res.job) {
      setError(res.error || 'Failed to create request.');
      return;
    }

    setRequestSentJob(res.job);
  };

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <Header currentUser={currentUser} onUserChange={onUserChange} />

      <main className="w-full pt-20 pb-16 flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Breadcrumb / Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/customer/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006c4c] hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#74777f]">Direct Matching</span>
              <span className="w-12 h-1.5 bg-[#006c4c] rounded-full inline-block" />
            </div>
          </div>

          {/* Title Header */}
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#001f3f]">
              Find a {serviceParam} Worker
            </h1>
            <p className="font-['Inter'] text-sm text-[#43474e] mt-1">
              Select a verified local worker and send your direct service dispatch request.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-[#ffdad6] text-[#93000a] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#ba1a1a]/20">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Service Details Card */}
          <div className="bg-[#ffffff] p-6 sm:p-7 rounded-3xl shadow-sm border border-[#e1e9e5]/80 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e9e5]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#e9edff] text-[#006c4c] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">handyman</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#74777f] uppercase tracking-wider block">
                    Service Category
                  </span>
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                    {serviceParam}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#74777f] block">Benchmark</span>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#006c4c]">
                  ₹{benchmarkPrice}
                </span>
              </div>
            </div>

            {/* Task Description Input */}
            <div>
              <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1.5">
                Work Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Describe the issue in detail..."
                className="w-full p-3.5 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
              />
            </div>

            {/* Address Input */}
            <div>
              <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1.5">
                Service Address / Neighborhood
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#74777f] text-[18px]">
                  location_on
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, landmark, area"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
                />
              </div>
            </div>

            {/* Offered Payout Adjuster */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-['Inter'] text-xs font-semibold text-[#0d1b36]">
                  Offered Service Fee (Held in Escrow)
                </label>
                <span className="text-[11px] text-[#006c4c] font-semibold">
                  Zero commission
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#f2f3ff] rounded-2xl border border-[#e1e9e5]/60">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustPrice(-50)}
                    disabled={offeredPrice <= 250}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-[#e9edff] text-[#001f3f] flex items-center justify-center font-bold text-lg shadow-xs disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                    ₹{offeredPrice}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustPrice(50)}
                    disabled={offeredPrice >= 1000}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-[#e9edff] text-[#001f3f] flex items-center justify-center font-bold text-lg shadow-xs disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-[#43474e]">
                  Released after satisfied completion
                </span>
              </div>
            </div>
          </div>

          {/* REAL REGISTERED WORKERS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f]">
                Available Nearby Workers
              </h2>
              <span className="text-xs text-[#74777f]">
                {displayWorkers.length} {displayWorkers.length === 1 ? 'technician' : 'technicians'} found
              </span>
            </div>

            {displayWorkers.length === 0 ? (
              /* REQUIRED EMPTY STATE: No demo fallback */
              <div className="bg-[#ffffff] rounded-3xl p-10 border border-[#e1e9e5] text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-[#f2f3ff] text-[#74777f] flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">
                    person_off
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base sm:text-lg text-[#001f3f]">
                  No workers are currently available nearby.
                </h3>
                <p className="font-['Inter'] text-xs sm:text-sm text-[#43474e] max-w-md mx-auto leading-relaxed">
                  There are currently no registered {serviceParam.toLowerCase()} technicians in this area. When a new worker creates an account and sets their status to Available, they will appear here.
                </p>
                <div className="pt-2">
                  <Link
                    to="/signup/worker"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#006c4c] hover:underline"
                  >
                    <span>Register as a worker partner</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {displayWorkers.map((worker) => {
                  const isSelected = selectedWorkerId === worker.id;
                  return (
                    <div
                      key={worker.id}
                      onClick={() => setSelectedWorkerId(worker.id)}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-[#006c4c] bg-[#f2f3ff] shadow-sm ring-2 ring-[#006c4c]/20'
                          : 'border-[#e1e9e5] bg-[#ffffff] hover:border-[#006c4c]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <img
                          alt={worker.fullName}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#006c4c]/30 shrink-0"
                          src={
                            worker.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              worker.fullName
                            )}&background=006c4c&color=ffffff`
                          }
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f] truncate">
                              {worker.fullName}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                worker.dutyStatus === 'available'
                                  ? 'bg-[#7bfac4]/40 text-[#007351]'
                                  : worker.dutyStatus === 'busy'
                                  ? 'bg-[#ffdcc2] text-[#904d00]'
                                  : 'bg-[#e9edff] text-[#43474e]'
                              }`}
                            >
                              {worker.dutyStatus || 'Available'}
                            </span>
                          </div>

                          <p className="font-['Inter'] text-xs text-[#43474e]">
                            <strong>{worker.primaryTrade || 'Technician'}</strong>
                            {worker.experience ? ` • ${worker.experience}` : ''}
                            {worker.baseLocation ? ` • ${worker.baseLocation}` : ''}
                          </p>

                          {worker.skills && worker.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {worker.skills.slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-[#e1e9e5] text-[#43474e]"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-bold text-[#006c4c] flex items-center gap-0.5">
                            ★ {worker.rating || 5.0}
                          </span>
                          <span className="text-[11px] text-[#74777f] block">
                            {worker.completedJobsCount || 0} jobs completed
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedWorkerId(worker.id)}
                            className="w-4 h-4 text-[#006c4c] focus:ring-[#006c4c]"
                          />
                          <span className="text-xs font-semibold text-[#006c4c]">
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Send Request Action Button */}
          {displayWorkers.length > 0 && (
            <button
              onClick={handleSendRequest}
              disabled={!selectedWorkerId}
              className="w-full py-4 bg-[#006c4c] hover:bg-[#003b2a] disabled:bg-[#c3c6cf] text-white font-['Inter'] font-bold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>
                {selectedWorker
                  ? `Send Work Request to ${selectedWorker.fullName}`
                  : 'Select a Worker to Send Request'}
              </span>
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          )}
        </div>
      </main>

      {/* REQUEST SENT CONFIRMATION MODAL */}
      {requestSentJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-[#ffffff] rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 border border-[#e1e9e5]">
            <div className="w-16 h-16 rounded-full bg-[#7bfac4] text-[#002114] mx-auto flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[36px]">
                check_circle
              </span>
            </div>

            <div>
              <span className="px-3 py-1 bg-[#d4e3ff] text-[#001c3a] font-['Inter'] text-xs font-bold rounded-full uppercase tracking-wider">
                Status: Pending
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f] mt-2">
                Work Request Sent!
              </h3>
              <p className="font-['Inter'] text-xs text-[#43474e] mt-1.5 leading-relaxed">
                Your request has been dispatched directly to <strong>{requestSentJob.workerName}</strong>. As soon as they accept, your live arrival tracking and verification OTP will activate.
              </p>
            </div>

            <div className="bg-[#f2f3ff] p-4 rounded-2xl text-left border border-[#e1e9e5] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#74777f]">Assigned Technician:</span>
                <span className="font-semibold text-[#0d1b36]">{requestSentJob.workerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74777f]">Service:</span>
                <span className="font-semibold text-[#0d1b36]">{requestSentJob.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74777f]">Offered Fee:</span>
                <span className="font-bold text-[#006c4c]">₹{requestSentJob.offeredPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74777f]">Request ID:</span>
                <span className="font-mono text-[#0d1b36]">#{requestSentJob.id}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/jobs/${requestSentJob.id}`)}
                className="w-full py-3 bg-[#006c4c] hover:bg-[#003b2a] text-white font-['Inter'] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Enter Private Job Room & Track</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/customer/dashboard')}
                className="w-full py-2.5 bg-[#f2f3ff] hover:bg-[#e9edff] text-[#0d1b36] font-['Inter'] font-semibold text-xs rounded-xl transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
