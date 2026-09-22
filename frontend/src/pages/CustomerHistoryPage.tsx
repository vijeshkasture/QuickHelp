import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { UserAccount, Job } from '../types';
import { getCustomerJobs } from '../services/storage';

interface CustomerHistoryProps {
  currentUser: UserAccount;
  onUserChange?: (user: UserAccount | null) => void;
}

export const CustomerHistoryPage: React.FC<CustomerHistoryProps> = ({
  currentUser,
  onUserChange,
}) => {
  const { activeJob, history } = getCustomerJobs(currentUser);
  const [selectedReceipt, setSelectedReceipt] = useState<Job | null>(null);

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <Header currentUser={currentUser} onUserChange={onUserChange} />

      <main className="w-full pt-20 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#001f3f]">
                Booking History & Invoices
              </h1>
              <p className="font-['Inter'] text-sm text-[#43474e] mt-0.5">
                Past neighborhood repairs with verified warranties and receipts
              </p>
            </div>
            <Link
              to="/customer/matching"
              className="inline-flex items-center gap-1.5 bg-[#006c4c] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#003b2a] transition-colors self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Request</span>
            </Link>
          </div>

          {/* Active Job Alert if any */}
          {activeJob && (
            <div className="bg-[#e9edff] p-4 rounded-2xl border border-[#d9e2ff] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#006c4c] animate-ping" />
                <div>
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f] block">
                    Active Ongoing Request: {activeJob.serviceTitle}
                  </span>
                  <span className="font-['Inter'] text-xs text-[#43474e]">
                    Assigned to {activeJob.workerName} • Handoff OTP: {activeJob.otp}
                  </span>
                </div>
              </div>
              <Link
                to={`/jobs/${activeJob.id}`}
                className="px-3 py-1.5 bg-[#12345b] text-white text-xs font-semibold rounded-lg hover:bg-[#001f3f]"
              >
                Enter Job Room
              </Link>
            </div>
          )}

          {/* History List */}
          <div className="space-y-3">
            {history.length > 0 ? (
              history.map((job) => (
                <div
                  key={job.id}
                  className="bg-[#ffffff] p-5 rounded-2xl border border-[#e1e9e5]/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#006c4c]/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#7bfac4]/30 text-[#007351] font-semibold text-[11px] rounded-full">
                        Completed
                      </span>
                      <span className="font-mono text-xs text-[#74777f]">#{job.id}</span>
                      <span className="text-xs text-[#74777f]">• {job.completedDate || 'June 2024'}</span>
                    </div>

                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                      {job.serviceTitle}
                    </h3>
                    <p className="font-['Inter'] text-xs text-[#43474e]">
                      Technician: <strong>{job.workerName || 'Verified Pro'}</strong> • {job.neighborhood}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#f2f3ff]">
                    <div className="text-left sm:text-right">
                      <span className="block font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                        ₹{job.offeredPrice}
                      </span>
                      <span className="block text-xs font-semibold text-[#006c4c]">
                        ★ {job.ratingGiven || 5.0} Rated
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="px-3 py-1.5 bg-[#f2f3ff] hover:bg-[#e9edff] text-[#12345b] text-xs font-semibold rounded-xl border border-[#e1e9e5] transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>Job Room</span>
                      </Link>
                      <button
                        onClick={() => setSelectedReceipt(job)}
                        className="px-3 py-1.5 bg-[#006c4c] hover:bg-[#005239] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">receipt</span>
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#ffffff] p-12 rounded-3xl border border-dashed border-[#c3c6cf] text-center space-y-3">
                <span className="material-symbols-outlined text-[36px] text-[#74777f]">
                  history
                </span>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                  No past bookings recorded
                </h3>
                <p className="font-['Inter'] text-xs text-[#43474e]">
                  As a real user, your completed work orders and service receipts will be listed here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e1e9e5] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f]">
                  QuickHelp Receipt
                </span>
                <span className="px-2 py-0.5 bg-[#7bfac4]/30 text-[#007351] text-[10px] font-bold rounded">
                  PAID
                </span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-[#74777f] hover:text-[#001f3f]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 font-['Inter'] text-xs">
              <div className="flex justify-between text-[#43474e]">
                <span>Receipt Number</span>
                <span className="font-mono font-bold text-[#001f3f]">RCP-{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between text-[#43474e]">
                <span>Service Category</span>
                <span className="font-semibold text-[#001f3f]">{selectedReceipt.serviceCategory}</span>
              </div>
              <div className="flex justify-between text-[#43474e]">
                <span>Technician</span>
                <span className="font-semibold text-[#001f3f]">{selectedReceipt.workerName}</span>
              </div>
              <div className="flex justify-between text-[#43474e]">
                <span>Date Settled</span>
                <span>{selectedReceipt.completedDate || '12 Jun 2024'}</span>
              </div>

              <div className="border-t border-dashed border-[#c3c6cf] my-2 pt-2 space-y-1.5">
                <div className="flex justify-between text-[#43474e]">
                  <span>Labor Charge (100% to Pro)</span>
                  <span>₹{selectedReceipt.offeredPrice}</span>
                </div>
                <div className="flex justify-between text-[#43474e]">
                  <span>Platform Commission</span>
                  <span className="text-[#006c4c] font-semibold">₹0 (Free)</span>
                </div>
                <div className="flex justify-between text-[#43474e]">
                  <span>GST / Taxes</span>
                  <span>Inclusive</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#001f3f] pt-1 border-t border-[#e1e9e5]">
                  <span>Total Amount Paid</span>
                  <span>₹{selectedReceipt.offeredPrice}</span>
                </div>
              </div>

              <div className="p-3 bg-[#f2f3ff] rounded-xl text-[11px] text-[#43474e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                  verified
                </span>
                <span>Includes QuickHelp 30-Day Revisit Warranty.</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 bg-[#12345b] text-white rounded-xl text-xs font-semibold hover:bg-[#001f3f]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
