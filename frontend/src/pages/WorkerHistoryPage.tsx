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

  const totalGrossCollected = recentSchedule.reduce((acc, curr) => acc + (curr.grossAmount || 0), 0);
  const netTakeHome = recentSchedule.reduce((acc, curr) => acc + (curr.netAmount || Math.round(curr.grossAmount * 0.9)), 0);
  const totalCommissionOwed = recentSchedule.reduce((acc, curr) => acc + (curr.commission || Math.round(curr.grossAmount * 0.1)), 0);

  const handleSettleCommission = () => {
    if (totalCommissionOwed === 0) {
      alert('You have ₹0 pending platform commission dues.');
      return;
    }
    alert(`Initiating UPI payment of ₹${totalCommissionOwed} for QuickHelp 10% platform commission.`);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex">
      <WorkerSidebar worker={worker} onWorkerUpdate={(w) => { setWorker(w); if (onUserChange) onUserChange(w); }} />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <WorkerHeader worker={worker} onWorkerUpdate={(w) => { setWorker(w); if (onUserChange) onUserChange(w); }} />

        <main className="pt-20 pb-16 px-4 md:px-8 space-y-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                Job History & Wallet Commission Ledger
              </h1>
              <p className="font-['Inter'] text-xs text-[#43474e] mt-0.5">
                Customers pay 100% Cash/UPI directly to you on site. 10% platform commission is tracked here.
              </p>
            </div>
            <Link
              to="/worker/dashboard"
              className="px-4 py-2 bg-[#12345b] text-white text-xs font-semibold rounded-xl hover:bg-[#001f3f]"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* 3-Part Wallet & Commission Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Gross Cash Collected */}
            <div className="bg-[#12345b] text-white p-6 rounded-3xl shadow-sm space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#d9e2ff] font-bold block">
                Total Cash Collected (100%)
              </span>
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-white">
                ₹{totalGrossCollected.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#d9e2ff]/80">
                Direct cash/UPI collected on site from customer
              </p>
            </div>

            {/* 2. Net Take-Home Earnings (90%) */}
            <div className="bg-[#ffffff] p-6 rounded-3xl shadow-sm border border-[#006c4c]/30 space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#006c4c] font-bold block">
                Net Take-Home (90%)
              </span>
              <div className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#006c4c]">
                ₹{netTakeHome.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#43474e]">
                Your net income after 10% app commission
              </p>
            </div>

            {/* 3. Platform Commission Payable (10%) */}
            <div className="bg-[#ffffff] p-6 rounded-3xl shadow-sm border border-[#ba1a1a]/20 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#ba1a1a] font-bold block">
                  App Commission Due (10%)
                </span>
                <div className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#ba1a1a] mt-1">
                  ₹{totalCommissionOwed.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-[#74777f] mt-0.5">
                  10% service fee owed to QuickHelp
                </p>
              </div>

              <button
                type="button"
                onClick={handleSettleCommission}
                className="w-full py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-['Inter'] font-bold text-xs rounded-xl shadow-xs transition-all mt-2"
              >
                Settle 10% Commission (UPI)
              </button>
            </div>
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
                    className="p-4 bg-[#f2f3ff] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#e1e9e5]/60 hover:bg-[#e9edff] transition-colors group block"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#e9edff] group-hover:bg-[#12345b] text-[#12345b] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
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

                    <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#e1e9e5]/50">
                      <div>
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f] block">
                          Cash Collected: {item.amount}
                        </span>
                        <span className="text-[11px] text-[#006c4c] font-medium block">
                          Net: ₹{item.netAmount} • 10% App Fee: ₹{item.commission}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#007351] font-semibold bg-[#7bfac4]/30 px-2 py-0.5 rounded-full whitespace-nowrap">
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
