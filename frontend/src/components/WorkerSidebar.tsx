import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QuickHelpLogo } from './Logo';
import { UserAccount, DutyStatus } from '../types';
import { updateWorkerDutyStatus, logoutUser } from '../services/storage';

interface WorkerSidebarProps {
  worker: UserAccount;
  onWorkerUpdate: (worker: UserAccount) => void;
}

export const WorkerSidebar: React.FC<WorkerSidebarProps> = ({ worker, onWorkerUpdate }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleDutyChange = (status: DutyStatus) => {
    const updated = updateWorkerDutyStatus(status);
    if (updated) onWorkerUpdate(updated);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/worker/dashboard', icon: 'grid_view' },
    { label: 'Requests', path: '/worker/requests', icon: 'notifications_active' },
    { label: 'Active Job', path: '/worker/job', icon: 'engineering' },
    { label: 'History', path: '/worker/history', icon: 'receipt_long' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#ffffff] z-50 flex flex-col pt-4 pb-6 shadow-[0_1px_8px_rgba(18,52,91,0.06)] border-r border-[#e1e9e5]/60 hidden md:flex">
      {/* Brand Header */}
      <div className="px-6 mb-6 flex items-center gap-2">
        <Link to="/worker/dashboard" className="flex items-center gap-2">
          <QuickHelpLogo size="md" showText={false} />
          <div className="flex flex-col">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#001f3f] tracking-tight leading-none">
              QuickHelp
            </span>
            <span className="font-['Inter'] text-[11px] text-[#006c4c] font-semibold uppercase tracking-wider mt-1">
              Partner Pro
            </span>
          </div>
        </Link>
      </div>

      {/* Duty Status Indicator in Sidebar */}
      <div className="px-4 mb-4">
        <div className="bg-[#f2f3ff] p-2.5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                worker.dutyStatus === 'available'
                  ? 'bg-[#006c4c] animate-pulse'
                  : worker.dutyStatus === 'busy'
                  ? 'bg-[#12345b]'
                  : 'bg-[#74777f]'
              }`}
            />
            <span className="font-['Inter'] text-[12px] text-[#0d1b36] font-semibold">
              Duty Status
            </span>
          </div>
          <span
            className={`font-['Inter'] text-[11px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${
              worker.dutyStatus === 'available'
                ? 'bg-[#7bfac4] text-[#007351]'
                : worker.dutyStatus === 'busy'
                ? 'bg-[#d4e3ff] text-[#001c3a]'
                : 'bg-[#e9edff] text-[#43474e]'
            }`}
          >
            {worker.dutyStatus || 'Offline'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-['Inter'] text-[14px] font-semibold transition-all ${
                isActive
                  ? 'bg-[#12345b] text-[#ffffff] shadow-[0_1px_4px_rgba(18,52,91,0.08)]'
                  : 'text-[#43474e] hover:bg-[#f2f3ff] hover:text-[#0d1b36]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Switch to Customer Portal Helper */}
      <div className="px-4 pb-3">
        <Link
          to="/customer/dashboard"
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#f2f3ff] hover:bg-[#e9edff] text-[#12345b] font-['Inter'] text-[12px] font-semibold rounded-lg transition-colors border border-[#e1e9e5]"
        >
          <span className="material-symbols-outlined text-[16px]">
            switch_account
          </span>
          Switch to Customer Mode
        </Link>
      </div>

      {/* Bottom Profile Pill */}
      <div className="px-4 pt-2 border-t border-[#e9edff]">
        <div className="bg-[#f2f3ff] rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#006c4c]/30 flex-shrink-0"
              src={
                worker.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  worker.fullName
                )}&background=006c4c&color=ffffff`
              }
            />
            <div className="overflow-hidden min-w-0">
              <span className="block font-['Inter'] text-[13px] font-semibold text-[#0d1b36] truncate">
                {worker.fullName}
              </span>
              <span className="block font-['Inter'] text-[11px] text-[#006c4c] font-medium truncate">
                {worker.primaryTrade || 'Technician'} Pro
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-[#74777f] hover:text-[#ba1a1a] p-1 rounded-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
