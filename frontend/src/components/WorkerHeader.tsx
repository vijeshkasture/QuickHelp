import React from 'react';
import { UserAccount, DutyStatus } from '../types';
import { updateWorkerDutyStatus, logoutUser } from '../services/storage';
import { useNavigate, Link } from 'react-router-dom';

interface WorkerHeaderProps {
  worker: UserAccount;
  onWorkerUpdate: (worker: UserAccount) => void;
}

export const WorkerHeader: React.FC<WorkerHeaderProps> = ({ worker, onWorkerUpdate }) => {
  const navigate = useNavigate();

  const handleDutyChange = (status: DutyStatus) => {
    const updated = updateWorkerDutyStatus(status);
    if (updated) onWorkerUpdate(updated);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(18,52,91,0.04)] z-40 flex items-center justify-between px-4 md:px-6 border-b border-[#e1e9e5]/60">
      {/* Operating Zone */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#006c4c] text-[20px]">
          verified
        </span>
        <span className="font-['Inter'] text-[13px] font-semibold text-[#43474e]">
          {worker.baseLocation || 'Freeganj & Madhav Nagar Zone'}
        </span>
      </div>

      {/* Duty Status Selector & Profile Actions */}
      <div className="flex items-center gap-3">
        {/* Available / Busy / Offline Pill Switcher */}
        <div className="flex items-center bg-[#f2f3ff] rounded-full p-1 gap-1 border border-[#e1e9e5]/60">
          <button
            onClick={() => handleDutyChange('available')}
            type="button"
            className={`px-3 py-1 rounded-full font-['Inter'] text-[12px] font-semibold transition-all ${
              worker.dutyStatus === 'available'
                ? 'bg-[#006c4c] text-[#ffffff] shadow-sm'
                : 'text-[#43474e] hover:text-[#0d1b36]'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => handleDutyChange('busy')}
            type="button"
            className={`px-3 py-1 rounded-full font-['Inter'] text-[12px] font-semibold transition-all ${
              worker.dutyStatus === 'busy'
                ? 'bg-[#12345b] text-[#ffffff] shadow-sm'
                : 'text-[#43474e] hover:text-[#0d1b36]'
            }`}
          >
            Busy
          </button>
          <button
            onClick={() => handleDutyChange('offline')}
            type="button"
            className={`px-3 py-1 rounded-full font-['Inter'] text-[12px] font-semibold transition-all ${
              worker.dutyStatus === 'offline'
                ? 'bg-[#e9edff] text-[#0d1b36] shadow-xs'
                : 'text-[#43474e] hover:text-[#0d1b36]'
            }`}
          >
            Offline
          </button>
        </div>

        {/* Notification Icon */}
        <Link
          to="/worker/requests"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f3ff] text-[#43474e] transition-colors relative"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {worker.dutyStatus === 'available' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#006c4c] ring-2 ring-white" />
          )}
        </Link>

        {/* Profile Avatar */}
        <img
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover ring-2 ring-[#006c4c]/30"
          src={
            worker.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              worker.fullName
            )}&background=006c4c&color=ffffff`
          }
        />
      </div>
    </header>
  );
};
