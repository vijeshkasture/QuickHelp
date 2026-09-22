import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuickHelpLogo } from '../components/Logo';
import { UserAccount } from '../types';

interface RoleSelectionPageProps {
  currentUser?: UserAccount | null;
  onUserChange?: (user: UserAccount | null) => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'customer' | 'worker' | null>(null);

  const handleRoleSelect = (role: 'customer' | 'worker') => {
    setSelectedRole(role);
    if (role === 'customer') {
      navigate('/signup/customer');
    } else {
      navigate('/signup/worker');
    }
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    handleRoleSelect(selectedRole);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-center">
        <Link to="/">
          <QuickHelpLogo size="lg" />
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-xl w-full mx-auto bg-[#ffffff] p-8 md:p-10 rounded-3xl shadow-[0_4px_24px_rgba(18,52,91,0.08)] border border-[#e1e9e5]/80 my-8">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#006c4c] hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Home</span>
          </Link>
          <span className="font-['Inter'] text-[12px] font-bold text-[#006c4c] tracking-wider uppercase">
            Step 1 of 2
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#f2f3ff] rounded-full mb-8 overflow-hidden">
          <div className="w-1/2 h-full bg-[#006c4c] rounded-full transition-all" />
        </div>

        <div className="text-center mb-8">
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#001f3f]">
            What are you looking for?
          </h2>
          <p className="font-['Inter'] text-sm text-[#43474e] mt-2">
            Choose an option below to create your QuickHelp account
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Card 1: Find a Worker (Customer) */}
          <div
            onClick={() => handleRoleSelect('customer')}
            className={`p-6 rounded-2xl cursor-pointer transition-all border-2 flex flex-col justify-between text-left group ${
              selectedRole === 'customer'
                ? 'border-[#006c4c] bg-[#f2f3ff] shadow-md ring-2 ring-[#006c4c]/20'
                : 'border-[#e1e9e5] bg-[#ffffff] hover:border-[#006c4c] hover:bg-[#faf8ff]'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#e9edff] text-[#006c4c] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">
                  person_search
                </span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f] mb-1">
                Find a Worker
              </h3>
              <p className="font-['Inter'] text-xs text-[#43474e] leading-relaxed">
                I need someone for a service or task.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#006c4c]">
              <span>Customer Signup</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </div>

          {/* Card 2: I Want to Work (Worker) */}
          <div
            onClick={() => handleRoleSelect('worker')}
            className={`p-6 rounded-2xl cursor-pointer transition-all border-2 flex flex-col justify-between text-left group ${
              selectedRole === 'worker'
                ? 'border-[#006c4c] bg-[#f2f3ff] shadow-md ring-2 ring-[#006c4c]/20'
                : 'border-[#e1e9e5] bg-[#ffffff] hover:border-[#006c4c] hover:bg-[#faf8ff]'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#e9edff] text-[#12345b] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">
                  handyman
                </span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#001f3f] mb-1">
                I Want to Work
              </h3>
              <p className="font-['Inter'] text-xs text-[#43474e] leading-relaxed">
                I want to offer my services and find work.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#006c4c]">
              <span>Worker Signup</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`w-full py-3.5 rounded-xl font-['Inter'] font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            selectedRole
              ? 'bg-[#006c4c] hover:bg-[#003b2a] text-white shadow-md cursor-pointer'
              : 'bg-[#c3c6cf] text-[#ffffff] cursor-not-allowed'
          }`}
        >
          <span>
            {selectedRole === 'worker'
              ? 'Continue to Worker Registration'
              : selectedRole === 'customer'
              ? 'Continue to Customer Registration'
              : 'Select an Option to Continue'}
          </span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>

        <div className="mt-6 text-center text-xs text-[#43474e]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#006c4c] hover:underline">
            Log in
          </Link>
        </div>
      </div>

      <div className="text-center font-['Inter'] text-[11px] text-[#74777f]">
        QuickHelp • Hyperlocal Household & Technician Services
      </div>
    </div>
  );
};
