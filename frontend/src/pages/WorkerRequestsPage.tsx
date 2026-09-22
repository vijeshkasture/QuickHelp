import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkerSidebar } from '../components/WorkerSidebar';
import { WorkerHeader } from '../components/WorkerHeader';
import { UserAccount } from '../types';
import { getWorkerRequests, acceptWorkerRequest, rejectWorkerRequest } from '../services/storage';

interface WorkerRequestsPageProps {
  currentUser: UserAccount;
  onUserChange?: (user: UserAccount | null) => void;
}

export const WorkerRequestsPage: React.FC<WorkerRequestsPageProps> = ({
  currentUser,
  onUserChange,
}) => {
  const navigate = useNavigate();
  const [worker, setWorker] = useState<UserAccount>(currentUser);
  const [pendingRequests, setPendingRequests] = useState(() => getWorkerRequests(worker.id).pendingRequests);
  const [error, setError] = useState<string | null>(null);

  const refreshRequests = () => {
    const data = getWorkerRequests(worker.id);
    setPendingRequests(data.pendingRequests);
  };

  useEffect(() => {
    refreshRequests();
    window.addEventListener('storage', refreshRequests);
    window.addEventListener('quickhelp_request_update', refreshRequests);
    const interval = setInterval(refreshRequests, 1500);

    return () => {
      window.removeEventListener('storage', refreshRequests);
      window.removeEventListener('quickhelp_request_update', refreshRequests);
      clearInterval(interval);
    };
  }, [worker.id]);

  const handleAcceptRequest = (requestId: string) => {
    setError(null);
    const res = acceptWorkerRequest(requestId);
    if (!res.success) {
      setError(res.error || 'Failed to accept request.');
      refreshRequests();
      return;
    }
    navigate(`/jobs/${requestId}`);
  };

  const handleDeclineRequest = (requestId: string) => {
    setError(null);
    const res = rejectWorkerRequest(requestId);
    if (!res.success) {
      setError(res.error || 'Failed to decline request.');
    }
    refreshRequests();
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex">
      <WorkerSidebar
        worker={worker}
        onWorkerUpdate={(w) => {
          setWorker(w);
          if (onUserChange) onUserChange(w);
        }}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <WorkerHeader
          worker={worker}
          onWorkerUpdate={(w) => {
            setWorker(w);
            if (onUserChange) onUserChange(w);
          }}
        />

        <main className="pt-20 pb-16 px-4 md:px-8 space-y-6 max-w-4xl mx-auto w-full">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
              Incoming Work Requests
            </h1>
            <p className="font-['Inter'] text-xs text-[#43474e] mt-0.5">
              Service requests sent directly to you by nearby households
            </p>
          </div>

          {worker.dutyStatus === 'available' && pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-[#ffffff] rounded-3xl p-6 sm:p-7 border-2 border-[#006c4c] shadow-sm space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-[#7bfac4] text-[#002114] text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#006c4c] animate-ping" />
                      <span>Direct Customer Request</span>
                    </span>
                    <span className="font-mono text-xs text-[#74777f]">
                      #{req.id} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#001f3f]">
                      {req.serviceTitle}
                    </h3>
                    <p className="font-['Inter'] text-xs text-[#43474e] mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[#006c4c] text-[16px]">
                        person
                      </span>
                      <span>Customer: <strong>{req.customerName}</strong> <span className="text-[#006c4c] font-medium">(Contact revealed upon acceptance)</span></span>
                    </p>
                    <p className="font-['Inter'] text-xs text-[#43474e] mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[#006c4c] text-[16px]">
                        location_on
                      </span>
                      <span>Dispatch Locality: {req.neighborhood}</span>
                    </p>
                  </div>

                  <p className="font-['Inter'] text-xs text-[#43474e] bg-[#f2f3ff] p-3.5 rounded-xl border border-[#e1e9e5]/60">
                    "{req.description}"
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#f2f3ff]">
                    <div>
                      <span className="text-[11px] text-[#74777f] block uppercase font-semibold">
                        Guaranteed Payout
                      </span>
                      <span className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#006c4c]">
                        ₹{req.offeredPrice}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeclineRequest(req.id)}
                        className="px-4 py-2.5 bg-[#f2f3ff] hover:bg-[#ffdad6]/40 text-[#ba1a1a] text-xs font-semibold rounded-xl border border-[#e1e9e5] transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(req.id)}
                        className="px-6 py-2.5 bg-[#006c4c] hover:bg-[#003b2a] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <span>Accept & Open Route</span>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#ffffff] rounded-3xl p-10 border border-[#e1e9e5] text-center space-y-3">
              <span className="material-symbols-outlined text-[36px] text-[#74777f]">
                notifications_paused
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                No pending work requests
              </h3>
              <p className="font-['Inter'] text-xs text-[#43474e] max-w-sm mx-auto">
                {worker.dutyStatus === 'available'
                  ? 'Your status is Available. When a household selects you or requests a service, it will appear here in real time.'
                  : 'You are currently offline. Switch your status to Available in the top bar to receive service requests.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
