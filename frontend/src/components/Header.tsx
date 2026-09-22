import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QuickHelpLogo } from './Logo';
import { UserAccount } from '../types';
import { logoutUser } from '../services/storage';

interface HeaderProps {
  currentUser?: UserAccount | null;
  onUserChange?: (user: UserAccount | null) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onUserChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(
    currentUser?.defaultLocation || 'Freeganj, Ujjain'
  );

  const isCustomerPortal = location.pathname.startsWith('/customer');

  const handleLogout = () => {
    logoutUser();
    if (onUserChange) onUserChange(null);
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#ffffff]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(18,52,91,0.06)] border-b border-[#e1e9e5]/60">
        <div className="h-16 max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Location Indicator */}
          <div className="flex items-center gap-6">
            <Link
              to={isCustomerPortal ? '/customer/dashboard' : '/'}
              className="flex items-center gap-2 hover:opacity-95 transition-opacity"
            >
              <QuickHelpLogo size="md" />
            </Link>

            {/* Location Pill Selector */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="hidden lg:flex items-center gap-1.5 bg-[#f2f3ff] hover:bg-[#e9edff] px-3.5 py-1.5 rounded-full transition-colors text-left"
              type="button"
            >
              <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                location_on
              </span>
              <span className="font-['Inter'] text-[13px] font-semibold text-[#0d1b36] max-w-[140px] truncate">
                {currentLocation}
              </span>
              <span className="material-symbols-outlined text-[#43474e] text-[16px]">
                keyboard_arrow_down
              </span>
            </button>
          </div>

          {/* Center Search Bar for Customer Portal */}
          {isCustomerPortal ? (
            <div className="hidden md:flex items-center flex-1 max-w-xs bg-[#f2f3ff] px-3 py-1.5 rounded-lg text-[#43474e] border border-transparent focus-within:border-[#006c4c]/40 transition-colors">
              <span className="material-symbols-outlined text-[18px] mr-2 text-[#43474e]">
                search
              </span>
              <input
                type="text"
                placeholder="Search plumber, AC repair..."
                className="font-['Inter'] text-[13px] bg-transparent border-none outline-none flex-1 text-[#0d1b36] placeholder:text-[#43474e]/70"
              />
              <kbd className="bg-[#ffffff] px-1.5 py-0.5 rounded text-[10px] font-mono shadow-xs border border-[#c3c6cf]/30 text-[#43474e]">
                ⌘K
              </kbd>
            </div>
          ) : (
            /* Navigation links for Public Landing */
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`font-['Inter'] text-[14px] transition-colors ${
                  location.pathname === '/'
                    ? 'text-[#12345b] font-semibold'
                    : 'text-[#43474e] hover:text-[#0d1b36]'
                }`}
              >
                Home
              </Link>
              <a
                href="#services"
                className="font-['Inter'] text-[14px] text-[#43474e] hover:text-[#0d1b36] transition-colors"
              >
                Services
              </a>
              <a
                href="#how-it-works"
                className="font-['Inter'] text-[14px] text-[#43474e] hover:text-[#0d1b36] transition-colors"
              >
                How It Works
              </a>
              <Link
                to="/signup/worker"
                className="font-['Inter'] text-[14px] text-[#43474e] hover:text-[#0d1b36] transition-colors"
              >
                For Workers
              </Link>
            </nav>
          )}

          {/* Customer Portal Navigation Tabs (Dashboard, My Requests, History) */}
          {isCustomerPortal && (
            <nav className="flex items-center gap-1">
              <Link
                to="/customer/dashboard"
                className={`px-3.5 py-1.5 rounded-lg font-['Inter'] text-[13px] font-semibold transition-all ${
                  location.pathname === '/customer/dashboard'
                    ? 'bg-[#12345b] text-[#ffffff] shadow-sm'
                    : 'text-[#43474e] hover:text-[#0d1b36] hover:bg-[#f2f3ff]'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/customer/requests"
                className={`px-3.5 py-1.5 rounded-lg font-['Inter'] text-[13px] font-semibold transition-all ${
                  location.pathname === '/customer/requests'
                    ? 'bg-[#12345b] text-[#ffffff] shadow-sm'
                    : 'text-[#43474e] hover:text-[#0d1b36] hover:bg-[#f2f3ff]'
                }`}
              >
                My Requests
              </Link>
              <Link
                to="/customer/history"
                className={`px-3.5 py-1.5 rounded-lg font-['Inter'] text-[13px] font-semibold transition-all ${
                  location.pathname === '/customer/history'
                    ? 'bg-[#12345b] text-[#ffffff] shadow-sm'
                    : 'text-[#43474e] hover:text-[#0d1b36] hover:bg-[#f2f3ff]'
                }`}
              >
                History
              </Link>
            </nav>
          )}

          {/* Right Action / Profile Menu */}
          <div className="flex items-center gap-3 relative">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-full hover:bg-[#f2f3ff] transition-colors"
                  type="button"
                >
                  <div className="text-right hidden sm:block">
                    <span className="block font-['Inter'] text-[13px] font-semibold text-[#0d1b36] leading-tight">
                      {currentUser.fullName}
                    </span>
                    <span className="block font-['Inter'] text-[11px] text-[#006c4c] font-semibold leading-tight">
                      {currentUser.role === 'customer'
                        ? 'Household Account'
                        : `${currentUser.primaryTrade || 'Technician'} Pro`}
                    </span>
                  </div>
                  <img
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#006c4c]/20"
                    src={
                      currentUser.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        currentUser.fullName
                      )}&background=12345b&color=ffffff`
                    }
                  />
                  <span className="material-symbols-outlined text-[#74777f] text-[18px]">
                    arrow_drop_down
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-12 mt-1 w-64 bg-[#ffffff] rounded-xl shadow-xl border border-[#e1e9e5] p-2 z-50 space-y-1">
                    <div className="px-3 py-2 border-b border-[#e9edff]">
                      <p className="font-['Inter'] text-[13px] font-semibold text-[#0d1b36]">
                        {currentUser.fullName}
                      </p>
                      <p className="font-['Inter'] text-[11px] text-[#43474e] truncate">
                        {currentUser.email}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d4e3ff] text-[#001c3a] capitalize">
                          {currentUser.role === 'customer' ? 'Customer' : 'Worker'}
                        </span>
                      </div>
                    </div>

                    {/* Authenticated Navigation Items */}
                    <Link
                      to={currentUser.role === 'customer' ? '/customer/dashboard' : '/worker/dashboard'}
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#0d1b36] hover:bg-[#f2f3ff] rounded-lg transition-colors font-medium"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#006c4c]">
                        space_dashboard
                      </span>
                      <span>Dashboard</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowAccountModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#0d1b36] hover:bg-[#f2f3ff] rounded-lg transition-colors font-medium text-left"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#006c4c]">
                        account_circle
                      </span>
                      <span>Profile / Account</span>
                    </button>

                    <div className="border-t border-[#e9edff] pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors font-medium"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          logout
                        </span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated Actions */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="font-['Inter'] text-[14px] font-semibold text-[#12345b] hover:text-[#0d1b36] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/select-role"
                  className="inline-flex items-center justify-center font-['Inter'] text-[14px] font-semibold bg-[#006c4c] text-white px-4 py-2 rounded-lg shadow-sm hover:bg-[#003b2a] transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#ffffff] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#001f3f]">
                Change Service Area
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-[#74777f] hover:text-[#0d1b36]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-['Inter'] text-[13px] text-[#43474e]">
              QuickHelp assigns verified technicians located closest to your neighborhood for fast 15-minute dispatch.
            </p>
            <div className="space-y-2">
              {[
                'Freeganj, Ujjain',
                'Madhav Nagar, Ujjain',
                'Rishi Nagar, Ujjain',
                'Nanakheda, Ujjain',
                'Mahakal Road, Ujjain',
              ].map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setCurrentLocation(loc);
                    setShowLocationModal(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-['Inter'] text-[14px] flex items-center justify-between transition-colors ${
                    currentLocation === loc
                      ? 'bg-[#e9edff] text-[#001f3f] font-semibold'
                      : 'hover:bg-[#f2f3ff] text-[#0d1b36]'
                  }`}
                >
                  <span>{loc}</span>
                  {currentLocation === loc && (
                    <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      {showAccountModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#ffffff] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-[#e1e9e5]">
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#001f3f]">
                Profile & Account
              </h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-[#74777f] hover:text-[#0d1b36]"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-[#f2f3ff] rounded-xl border border-[#d9e2ff]/60">
              <img
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#006c4c]/30"
                src={
                  currentUser.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    currentUser.fullName
                  )}&background=12345b&color=ffffff`
                }
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f] truncate">
                  {currentUser.fullName}
                </h4>
                <p className="font-['Inter'] text-xs text-[#43474e] truncate">
                  {currentUser.email}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#006c4c]/10 text-[#006c4c] rounded-full text-[11px] font-semibold capitalize">
                  {currentUser.role === 'customer' ? 'Household Customer' : `${currentUser.primaryTrade || 'Technician'} Partner`}
                </span>
              </div>
            </div>

            <div className="space-y-3 font-['Inter'] text-xs text-[#43474e]">
              <div className="flex justify-between py-1.5 border-b border-[#e1e9e5]/60">
                <span className="font-semibold text-[#0d1b36]">Mobile Number</span>
                <span>{currentUser.mobile || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#e1e9e5]/60">
                <span className="font-semibold text-[#0d1b36]">Location</span>
                <span>{currentUser.defaultLocation || currentUser.address || 'Freeganj, Ujjain'}</span>
              </div>
              {currentUser.role === 'worker' && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-[#e1e9e5]/60">
                    <span className="font-semibold text-[#0d1b36]">Primary Trade</span>
                    <span>{currentUser.primaryTrade || 'Technician'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#e1e9e5]/60">
                    <span className="font-semibold text-[#0d1b36]">Service Radius</span>
                    <span>{currentUser.dispatchRadius || 5} km</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <Link
                to={currentUser.role === 'customer' ? '/customer/dashboard' : '/worker/dashboard'}
                onClick={() => setShowAccountModal(false)}
                className="flex-1 py-2.5 bg-[#006c4c] hover:bg-[#003b2a] text-white text-center font-['Inter'] font-semibold text-xs rounded-xl transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="px-4 py-2.5 bg-[#f2f3ff] hover:bg-[#e9edff] text-[#0d1b36] font-['Inter'] font-semibold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
