import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkerSidebar } from '../components/WorkerSidebar';
import { WorkerHeader } from '../components/WorkerHeader';
import { UserAccount } from '../types';
import { getWorkerData } from '../services/storage';

interface WorkerHistoryPageProps {
  currentUser: UserAccount;
  onUserChange?: (user: UserAccount | null) => void;
}

export const WorkerHistoryPage: React.FC<WorkerHistoryPageProps> = ({ currentUser, onUserChange }) => {
  const [worker, setWorker] = useState<UserAccount>(currentUser);
  const { recentSchedule } = getWorkerData(worker);

  const totalEarned = recentSchedule.reduce((acc, curr) => {
    const num = parseInt(curr.amount.replace(/\D/g, ''), 10);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="min-h-screen bg-[#faf8ff] flex">
      <WorkerSidebar worker={worker} onWorkerUpdate={(w) => { setWorker(w); if (onUserChange) onUserChange(w); }} />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <WorkerHeader worker={worker} onWorkerUpdate={(w) => { setWorker(w); if (onUserChange) onUserChange(w); }} />

        <main className="pt-20 pb-16 px-4 md:px-8 space-y-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                Job History & Wallet Payouts
              </h1>
              <p className="font-['Inter'] text-xs text-[#43474e] mt-0.5">
                All settled dispatches are deposited directly with zero platform deductions
              </p>
            </div>
            <Link
              to="/worker/dashboard"
              className="px-4 py-2 bg-[#12345b] text-white text-xs font-semibold rounded-xl hover:bg-[#001f3f]"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Wallet Balance Summary Card */}
          <div className="bg-[#12345b] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#7bfac4] font-bold">
                Available Wallet Balance
              </span>
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-3xl sm:text-4xl text-white mt-1">
                ₹{totalEarned > 0 ? `${totalEarned.toLocaleString('en-IN')}.00` : '0.00'}
              </div>
              <span className="text-xs text-[#d9e2ff] mt-1 block">
                Next automatic bank transfer: Tomorrow morning
              </span>
            </div>

            <button
              type="button"
              onClick={() => alert('Withdrawal request of full balance initiated to your registered UPI ID.')}
              className="px-6 py-3 bg-[#7bfac4] hover:bg-[#5ddda9] text-[#002114] font-['Inter'] font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
            >
              Instant UPI Payout
            </button>
          </div>

          {/* Schedule List */}
          <div className="bg-[#ffffff] rounded-3xl p-6 border border-[#e1e9e5]/80 space-y-4">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
              Completed Dispatch Records
            </h3>

            <div className="space-y-3">
              {recentSchedule.length > 0 ? (
                recentSchedule.map((item) => (
                  <Link
                    key={item.id}
                    to={`/jobs/${item.id}`}
                    className="p-4 bg-[#f2f3ff] rounded-2xl flex items-center justify-between border border-[#e1e9e5]/60 hover:bg-[#e9edff] transition-colors group block"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#e9edff] group-hover:bg-[#12345b] text-[#12345b] group-hover:text-white flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[20px]">
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f] group-hover:text-[#006c4c] transition-colors block">
                          {item.title}
                        </span>
                        <span className="font-['Inter'] text-xs text-[#74777f]">
                          Ref: #{item.id} • {item.location}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#006c4c] block">
                        {item.amount}
                      </span>
                      <span className="text-[10px] text-[#007351] font-semibold bg-[#7bfac4]/30 px-2 py-0.5 rounded-full">
                        {item.status} →
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#74777f]">
                  No past jobs recorded yet.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
