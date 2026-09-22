import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WorkerSidebar } from '../components/WorkerSidebar';
import { WorkerHeader } from '../components/WorkerHeader';
import { UserAccount, DutyStatus } from '../types';
import { getWorkerData, updateWorkerDutyStatus, acceptWorkerRequest, rejectWorkerRequest } from '../services/storage';

interface WorkerDashboardProps {
  currentUser: UserAccount;
  onUserChange?: (user: UserAccount | null) => void;
}

export const WorkerDashboardPage: React.FC<WorkerDashboardProps> = ({
  currentUser,
  onUserChange,
}) => {
  const navigate = useNavigate();
  const [worker, setWorker] = useState<UserAccount>(currentUser);
  const [countdown, setCountdown] = useState(45);
  const [leadAccepted, setLeadAccepted] = useState(false);

  useEffect(() => {
    setWorker(currentUser);
  }, [currentUser]);

  // Lead countdown timer
  useEffect(() => {
    if (worker.dutyStatus !== 'available') return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 45));
    }, 1000);
    return () => clearInterval(timer);
  }, [worker.dutyStatus]);

  const handleWorkerUpdate = (updated: UserAccount) => {
    setWorker(updated);
    if (onUserChange) onUserChange(updated);
  };

  const [workerData, setWorkerData] = useState(() => getWorkerData(currentUser));

  const refreshWorkerData = () => {
    setWorkerData(getWorkerData(currentUser));
  };

  useEffect(() => {
    refreshWorkerData();
    window.addEventListener('storage', refreshWorkerData);
    window.addEventListener('quickhelp_request_update', refreshWorkerData);
    const interval = setInterval(refreshWorkerData, 1500);

    return () => {
      window.removeEventListener('storage', refreshWorkerData);
      window.removeEventListener('quickhelp_request_update', refreshWorkerData);
      clearInterval(interval);
    };
  }, [currentUser]);

  const { incomingLead, recentSchedule } = workerData;

  const handleAcceptLead = () => {
    if (!incomingLead) return;
    setLeadAccepted(true);
    const res = acceptWorkerRequest(incomingLead.id);
    if (res.success) {
      setTimeout(() => {
        navigate(`/jobs/${incomingLead.id}`);
      }, 500);
    } else {
      alert(res.error || 'Failed to accept lead.');
      setLeadAccepted(false);
      refreshWorkerData();
    }
  };

  const handleDeclineLead = () => {
    if (!incomingLead) return;
    rejectWorkerRequest(incomingLead.id, 'Declined by worker');
    refreshWorkerData();
  };

  const handleToggleAvailable = () => {
    const updated = updateWorkerDutyStatus('available');
    if (updated) handleWorkerUpdate(updated);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex">
      {/* Worker Fixed Sidebar */}
      <WorkerSidebar worker={worker} onWorkerUpdate={handleWorkerUpdate} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <WorkerHeader worker={worker} onWorkerUpdate={handleWorkerUpdate} />

        <main className="pt-20 pb-16 px-4 md:px-8 space-y-6 max-w-6xl mx-auto w-full">
          {/* Top Identity Matrix Banner */}
          <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-7 shadow-xs border border-[#e1e9e5]/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  alt={worker.fullName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-[#006c4c]/40"
                  src={
                    worker.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      worker.fullName
                    )}&background=006c4c&color=ffffff`
                  }
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#006c4c] text-white flex items-center justify-center ring-2 ring-white text-xs">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-xl sm:text-2xl text-[#001f3f]">
                    {worker.fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-[#f2f3ff] text-[#12345b] rounded-full text-xs font-semibold">
                    {worker.tier || 'Verified Technician Pro'}
                  </span>
                </div>

                <p className="font-['Inter'] text-xs text-[#43474e]">
                  Primary Trade: <strong>{worker.primaryTrade || 'Electrician'}</strong> • Radius: {worker.dispatchRadius || 5} km
                </p>

                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="text-[#006c4c] font-bold">★ {worker.rating || 4.8} Rating</span>
                  <span className="text-[#74777f]">•</span>
                  <span className="text-[#12345b] font-semibold">{worker.reliabilityScore || 94}% Reliability</span>
                  <span className="text-[#74777f]">•</span>
                  <span className="text-[#74777f]">{worker.completedJobsCount || 127} Completed Tasks</span>
                </div>
              </div>
            </div>

            {/* GPS & Status Indicator */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-[#e1e9e5]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e9edff] text-[#12345b] rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#006c4c] animate-pulse" />
                <span>GPS Ping Active (Freeganj Base)</span>
              </div>
              <span className="text-[11px] text-[#74777f]">
                {worker.dutyStatus === 'available' ? 'Accepting Live Dispatches' : 'Duty: ' + (worker.dutyStatus || 'Offline')}
              </span>
            </div>
          </div>

          {/* LIVE INCOMING DISPATCH LEAD (Lead Card with Countdown) */}
          {worker.dutyStatus === 'available' && incomingLead ? (
            <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 shadow-md border-2 border-[#006c4c] relative overflow-hidden animate-in fade-in">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#f2f3ff] overflow-hidden">
                <div
                  className="h-full bg-[#006c4c] transition-all duration-1000"
                  style={{ width: `${(countdown / 45) * 100}%` }}
                />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#7bfac4] text-[#002114] text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#006c4c] animate-ping" />
                      <span>Live Incoming Dispatch</span>
                    </span>
                    <span className="text-xs font-semibold text-[#ba1a1a]">
                      ⏱ {countdown}s to respond
                    </span>
                  </div>

                  <div>
                    <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                      {incomingLead.serviceTitle}
                    </h2>
                    <p className="font-['Inter'] text-sm text-[#43474e] mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                        location_on
                      </span>
                      <span>{incomingLead.address}</span>
                      <span className="text-xs font-semibold text-[#12345b]">
                        ({incomingLead.distanceKm} • {incomingLead.transitTime})
                      </span>
                    </p>
                  </div>

                  <p className="font-['Inter'] text-xs text-[#43474e] bg-[#f2f3ff] p-3 rounded-xl border border-[#e1e9e5]/60 max-w-xl">
                    "{incomingLead.description}"
                  </p>
                </div>

                {/* Right side: Guaranteed Payout & Actions */}
                <div className="flex flex-col items-start lg:items-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#e1e9e5]">
                  <div className="text-left lg:text-right">
                    <span className="text-xs uppercase tracking-wider text-[#74777f] font-semibold block">
                      Guaranteed Instant Payout
                    </span>
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-3xl sm:text-4xl text-[#006c4c]">
                      ₹{incomingLead.offeredPrice}
                    </span>
                    <span className="text-[11px] text-[#74777f] block">
                      Benchmark: ₹{incomingLead.benchmarkPrice} (+₹200 Customer Priority)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDeclineLead}
                      className="flex-1 sm:flex-none px-4 py-3 bg-[#f2f3ff] hover:bg-[#ffdad6]/40 text-[#ba1a1a] font-['Inter'] text-xs font-semibold rounded-xl border border-[#e1e9e5] transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptLead}
                      disabled={leadAccepted}
                      className="flex-1 sm:flex-none px-6 py-3 bg-[#006c4c] hover:bg-[#003b2a] text-white font-['Inter'] text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>{leadAccepted ? 'Dispatch Confirmed!' : 'Accept Dispatch'}</span>
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : worker.dutyStatus === 'offline' ? (
            /* Offline State Banner */
            <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 border border-dashed border-[#c3c6cf] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f2f3ff] text-[#74777f] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">bedtime</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f]">
                    You are currently Offline
                  </h3>
                  <p className="font-['Inter'] text-xs text-[#43474e] mt-0.5">
                    Toggle your status to Available to start receiving incoming neighborhood leads within your {worker.dispatchRadius || 5} km radius.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleAvailable}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#006c4c] hover:bg-[#003b2a] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                Go Available Now
              </button>
            </div>
          ) : (
            /* Available but waiting for radar dispatch (e.g. for real newly registered worker) */
            <div className="bg-[#ffffff] rounded-3xl p-8 border border-[#e1e9e5] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#7bfac4]/30 text-[#007351] mx-auto flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-[24px]">radar</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f]">
                Standing By in {worker.baseLocation || 'Freeganj'}
              </h3>
              <p className="font-['Inter'] text-xs text-[#43474e] max-w-md mx-auto">
                Your GPS beacon is broadcasting. New household requests for {worker.primaryTrade || 'services'} in your radius will trigger an instant dispatch alert here.
              </p>
            </div>
          )}

          {/* PARTNER STANDING 4-METRIC MATRIX */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#ffffff] p-5 rounded-2xl shadow-xs border border-[#e1e9e5]/80 space-y-1">
              <span className="font-['Inter'] text-xs text-[#74777f] font-medium">
                Acceptance Rate
              </span>
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                {worker.acceptanceRate || 91}%
              </div>
              <span className="text-[11px] text-[#006c4c] font-semibold">
                ✓ Target achieved (&gt;85%)
              </span>
            </div>

            <div className="bg-[#ffffff] p-5 rounded-2xl shadow-xs border border-[#e1e9e5]/80 space-y-1">
              <span className="font-['Inter'] text-xs text-[#74777f] font-medium">
                On-Time Arrival
              </span>
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                {worker.onTimeArrival || 97}%
              </div>
              <span className="text-[11px] text-[#006c4c] font-semibold">
                Avg. 11m travel time
              </span>
            </div>

            <div className="bg-[#ffffff] p-5 rounded-2xl shadow-xs border border-[#e1e9e5]/80 space-y-1">
              <span className="font-['Inter'] text-xs text-[#74777f] font-medium">
                Completed Jobs
              </span>
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                {worker.completedJobsCount || 127}
              </div>
              <span className="text-[11px] text-[#12345b] font-semibold">
                All-time verified jobs
              </span>
            </div>

            <div className="bg-[#ffffff] p-5 rounded-2xl shadow-xs border border-[#e1e9e5]/80 space-y-1">
              <span className="font-['Inter'] text-xs text-[#74777f] font-medium">
                Reliability Score
              </span>
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                {worker.reliabilityScore || 94}%
              </div>
              <span className="text-[11px] text-[#006c4c] font-semibold">
                Top 5% in Freeganj Ward
              </span>
            </div>
          </div>

          {/* 7-DAY VELOCITY CHART & RECENT SETTLED SCHEDULE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: 7-Day Velocity Bar Chart */}
            <div className="lg:col-span-7 bg-[#ffffff] p-6 rounded-3xl border border-[#e1e9e5]/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                    7-Day Earning Velocity
                  </h3>
                  <p className="font-['Inter'] text-xs text-[#74777f]">
                    Weekly direct payout volume
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#006c4c]">
                    ₹6,900
                  </span>
                  <span className="block text-[10px] text-[#74777f]">This Week</span>
                </div>
              </div>

              {/* Bar Chart Representation */}
              <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4 border-b border-[#f2f3ff] pb-2">
                {[
                  { day: 'Mon', amount: 600, height: '40%' },
                  { day: 'Tue', amount: 400, height: '28%' },
                  { day: 'Wed', amount: 1200, height: '70%' },
                  { day: 'Thu', amount: 950, height: '55%' },
                  { day: 'Fri', amount: 1500, height: '85%' },
                  { day: 'Sat', amount: 1800, height: '100%' },
                  { day: 'Sun', amount: 450, height: '30%' },
                ].map((item) => (
                  <div key={item.day} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-[#74777f] opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{item.amount}
                    </span>
                    <div
                      className="w-full bg-[#e9edff] group-hover:bg-[#006c4c] rounded-t-lg transition-colors"
                      style={{ height: item.height }}
                    />
                    <span className="text-[11px] font-medium text-[#43474e]">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Recent Completed Schedule */}
            <div className="lg:col-span-5 bg-[#ffffff] p-6 rounded-3xl border border-[#e1e9e5]/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                  Recent Completed Schedule
                </h3>
                <Link
                  to="/worker/history"
                  className="font-['Inter'] text-xs font-semibold text-[#006c4c] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {recentSchedule.length > 0 ? (
                  recentSchedule.map((item) => (
                    <Link
                      key={item.id}
                      to={`/jobs/${item.id}`}
                      className="p-3 bg-[#f2f3ff] hover:bg-[#e9edff] rounded-2xl flex items-center justify-between border border-[#e1e9e5]/60 transition-colors group block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#e9edff] group-hover:bg-[#12345b] text-[#12345b] group-hover:text-white flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-[18px]">
                            {item.icon}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-xs text-[#001f3f] group-hover:text-[#006c4c] transition-colors">
                            {item.title}
                          </h4>
                          <span className="font-['Inter'] text-[11px] text-[#74777f]">
                            {item.location}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#006c4c] block">
                          {item.amount}
                        </span>
                        <span className="text-[10px] text-[#007351] font-semibold">
                          {item.status} →
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-[#74777f]">
                    No completed jobs yet. Accept incoming requests to start building your record!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Partner Support & Emergency Helpline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#e9edff] p-5 rounded-2xl flex items-center justify-between border border-[#d9e2ff]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#006c4c] text-[24px]">
                  support_agent
                </span>
                <div>
                  <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f]">
                    Partner Help Desk (24/7)
                  </h4>
                  <p className="font-['Inter'] text-xs text-[#43474e]">
                    Direct operator line for routing, disputes or payouts
                  </p>
                </div>
              </div>
              <a
                href="tel:1800123456"
                className="px-3 py-1.5 bg-[#ffffff] text-[#001f3f] text-xs font-semibold rounded-lg shadow-xs hover:bg-[#f2f3ff]"
              >
                Call Desk
              </a>
            </div>

            <div className="bg-[#ffdad6]/40 p-5 rounded-2xl flex items-center justify-between border border-[#ba1a1a]/20">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">
                  emergency
                </span>
                <div>
                  <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#93000a]">
                    Worker Safety SOS
                  </h4>
                  <p className="font-['Inter'] text-xs text-[#93000a]/80">
                    One-tap emergency broadcast to local patrol
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert('Emergency SOS triggered: Broadcasted location beacon to Freeganj Police Ward.')}
                className="px-3 py-1.5 bg-[#ba1a1a] text-white text-xs font-semibold rounded-lg hover:bg-[#93000a]"
              >
                Trigger SOS
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
