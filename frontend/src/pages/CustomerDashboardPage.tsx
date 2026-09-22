import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { UserAccount } from '../types';
import { getCustomerJobs } from '../services/storage';

interface CustomerDashboardProps {
  currentUser: UserAccount;
  onUserChange?: (user: UserAccount | null) => void;
}

export const CustomerDashboardPage: React.FC<CustomerDashboardProps> = ({
  currentUser,
  onUserChange,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [customerJobs, setCustomerJobs] = useState(() => getCustomerJobs(currentUser));

  useEffect(() => {
    const refresh = () => {
      setCustomerJobs(getCustomerJobs(currentUser));
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('quickhelp_request_update', refresh);
    const interval = setInterval(refresh, 1500);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('quickhelp_request_update', refresh);
      clearInterval(interval);
    };
  }, [currentUser]);

  const { activeJob, history } = customerJobs;

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleServiceSelect = (serviceTitle: string) => {
    // Navigate to pricing and matching screen with prefilled service
    navigate(`/customer/matching?service=${encodeURIComponent(serviceTitle)}`);
  };

  const services = [
    {
      title: 'Electrician',
      icon: 'electric_bolt',
      subtitle: 'Wiring, fixtures, repairs',
      price: 'From ₹149',
    },
    {
      title: 'Plumber',
      icon: 'plumbing',
      subtitle: 'Leaks, pipes, fittings',
      price: 'From ₹179',
    },
    {
      title: 'Carpenter',
      icon: 'carpenter',
      subtitle: 'Doors, furniture, locks',
      price: 'From ₹199',
    },
    {
      title: 'AC Repair',
      icon: 'mode_fan',
      subtitle: 'Cleaning, gas, cooling',
      price: 'From ₹449',
    },
    {
      title: 'Painter',
      icon: 'format_paint',
      subtitle: 'Touch-ups, rooms',
      price: 'From ₹299',
    },
    {
      title: 'Cleaning',
      icon: 'cleaning_services',
      subtitle: 'Deep home, bath, kitchen',
      price: 'From ₹399',
    },
    {
      title: 'Appliance Repair',
      icon: 'local_laundry_service',
      subtitle: 'Fridge, washing machine',
      price: 'From ₹249',
    },
    {
      title: 'More Tasks',
      icon: 'apps',
      subtitle: 'Drivers, helpers, garden',
      price: 'Custom quote',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <Header currentUser={currentUser} onUserChange={onUserChange} />

      <main className="w-full pt-20 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
          {/* Top Greeting & Location Context */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f2f3ff] text-[#006c4c] rounded-full text-xs font-semibold mb-1 border border-[#e1e9e5]/60">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>{currentUser.defaultLocation || 'Freeganj, Ujjain'}</span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#001f3f]">
                {getGreeting()}, {currentUser.fullName.split(' ')[0]}
              </h1>
              <p className="font-['Inter'] text-sm text-[#43474e] mt-0.5">
                4 verified technicians are available in your immediate neighborhood right now
              </p>
            </div>

            {/* Quick Request Button */}
            <button
              onClick={() => handleServiceSelect('Electrician')}
              className="inline-flex items-center justify-center gap-2 bg-[#006c4c] hover:bg-[#003b2a] text-white px-5 py-2.5 rounded-xl font-['Inter'] font-semibold text-sm shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>New Service Request</span>
            </button>
          </div>

          {/* ACTIVE ONGOING JOB CARD (If active job exists) */}
          {activeJob && (
            <div className="bg-[#ffffff] rounded-2xl p-6 shadow-md border-2 border-[#12345b]/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#12345b]" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 font-['Inter'] text-[11px] font-bold rounded-full tracking-wider uppercase ${
                      activeJob.status === 'pending'
                        ? 'bg-[#d4e3ff] text-[#001c3a]'
                        : 'bg-[#12345b] text-white'
                    }`}>
                      {activeJob.status === 'pending' ? 'Request Pending' : activeJob.status === 'accepted' ? 'Accepted • On Route' : 'Active'}
                    </span>
                    <span className="font-mono text-xs text-[#74777f]">
                      ID: #{activeJob.id}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#001f3f]">
                      {activeJob.serviceTitle}
                    </h3>
                    <p className="font-['Inter'] text-xs text-[#43474e] mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#006c4c] text-[16px]">
                        place
                      </span>
                      <span>{activeJob.address}</span>
                    </p>
                  </div>

                  {/* Worker Dispatch Pill */}
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      alt={activeJob.workerName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#006c4c]/40"
                      src={
                        activeJob.workerAvatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          activeJob.workerName || 'Worker'
                        )}&background=12345b&color=ffffff`
                      }
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Inter'] font-semibold text-sm text-[#0d1b36]">
                          {activeJob.workerName}
                        </span>
                        <span className="inline-flex items-center text-xs font-bold text-[#006c4c] bg-[#7bfac4]/30 px-1.5 py-0.5 rounded">
                          ★ {activeJob.workerRating || 4.8}
                        </span>
                      </div>
                      <p className="font-['Inter'] text-xs text-[#43474e]">
                        {activeJob.workerTrade || 'Verified Pro'} • ETA {activeJob.transitTime} ({activeJob.distanceKm})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side: Security OTP & Tracking Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#e1e9e5]">
                  {activeJob.status === 'pending' ? (
                    <div className="bg-[#f2f3ff] px-4 py-2.5 rounded-xl border border-[#d9e2ff] text-center w-full sm:w-auto">
                      <span className="font-['Inter'] text-[11px] text-[#006c4c] block uppercase font-bold">
                        Awaiting Response
                      </span>
                      <span className="text-xs text-[#43474e] block mt-0.5">
                        Sent to {activeJob.workerName}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-[#f2f3ff] px-4 py-2.5 rounded-xl border border-[#d9e2ff] text-center w-full sm:w-auto">
                      <span className="font-['Inter'] text-[11px] text-[#43474e] block uppercase font-medium">
                        Arrival Handoff OTP
                      </span>
                      <span className="font-mono font-bold text-xl text-[#001f3f] tracking-widest block">
                        {activeJob.otp}
                      </span>
                      <span className="text-[10px] text-[#006c4c] font-medium block">
                        Share only upon arrival
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      to={`/jobs/${activeJob.id}`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#12345b] hover:bg-[#001f3f] text-white px-5 py-2.5 rounded-xl font-['Inter'] font-semibold text-sm transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      <span>{activeJob.status === 'pending' ? 'View Live Request' : 'Enter Secure Job Room'}</span>
                    </Link>
                    <Link
                      to={`/jobs/${activeJob.id}`}
                      className="px-4 py-2.5 bg-[#f2f3ff] hover:bg-[#e9edff] text-[#001f3f] rounded-xl font-['Inter'] font-semibold text-sm transition-colors border border-[#e1e9e5]"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="bg-[#ffffff] p-4 rounded-2xl shadow-xs border border-[#e1e9e5]/60 space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#74777f]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for services (e.g., 'tap leaking', 'switch repair', 'fan fitting', 'AC gas')..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all"
              />
            </div>

            {/* Trending filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {['All', 'Quick Dispatch (< 15 min)', '₹300 - ₹500 Benchmark', 'Verified Pros Only', 'Emergency'].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                      activeFilter === filter
                        ? 'bg-[#12345b] text-white'
                        : 'bg-[#f2f3ff] text-[#43474e] hover:bg-[#e9edff]'
                    }`}
                  >
                    {filter}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Emergency / Quick Assistance Hero Card */}
          <div className="bg-gradient-to-r from-[#12345b] to-[#001f3f] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[#7bfac4] font-['Inter'] text-xs font-semibold backdrop-blur-xs">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Hyperlocal 15-Minute Response</span>
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-white">
                Emergency or quick assistance needed?
              </h2>
              <p className="font-['Inter'] text-sm text-[#d9e2ff] leading-relaxed">
                Nearby verified workers can reach your doorstep within 15–30 minutes for plumbing bursts, short circuits, or critical fixes.
              </p>
            </div>

            <button
              onClick={() => handleServiceSelect('Emergency Repair')}
              className="w-full md:w-auto px-7 py-3.5 bg-[#7bfac4] hover:bg-[#5ddda9] text-[#002114] font-['Inter'] font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Request a Worker Now</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>

          {/* 8-Service Category Bento Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#001f3f]">
                Explore Services
              </h2>
              <span className="font-['Inter'] text-xs text-[#006c4c] font-semibold">
                8 Core Trades Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {services.map((item) => (
                <div
                  key={item.title}
                  onClick={() => handleServiceSelect(item.title)}
                  className="bg-[#ffffff] p-5 rounded-2xl shadow-xs hover:shadow-md border border-[#e1e9e5]/60 cursor-pointer transition-all hover:border-[#006c4c]/40 group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-[#f2f3ff] text-[#12345b] group-hover:bg-[#006c4c] group-hover:text-white transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f] group-hover:text-[#006c4c] transition-colors">
                        {item.title}
                      </h3>
                      <p className="font-['Inter'] text-xs text-[#43474e] mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#f2f3ff] flex items-center justify-between">
                    <span className="font-['Inter'] text-xs font-bold text-[#006c4c]">
                      {item.price}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[#74777f] group-hover:translate-x-1 group-hover:text-[#006c4c] transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT BOOKINGS SECTION */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#001f3f]">
                Recent Bookings & Activity
              </h2>
              <Link
                to="/customer/history"
                className="font-['Inter'] text-xs text-[#006c4c] font-semibold hover:underline"
              >
                View all ({history.length})
              </Link>
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {history.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-[#ffffff] p-5 rounded-2xl shadow-xs border border-[#e1e9e5]/60 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 bg-[#7bfac4]/30 text-[#007351] rounded-full text-[11px] font-semibold">
                          Completed
                        </span>
                        <span className="font-['Inter'] text-xs text-[#74777f]">
                          {booking.completedDate || 'Recent'}
                        </span>
                      </div>
                      <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                        {booking.serviceTitle}
                      </h4>
                      <p className="font-['Inter'] text-xs text-[#43474e] mt-1">
                        Technician: {booking.workerName || 'Assigned Pro'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#f2f3ff] flex items-center justify-between">
                      <span className="font-['Inter'] font-bold text-sm text-[#001f3f]">
                        ₹{booking.offeredPrice}
                      </span>
                      <div className="flex items-center text-xs text-[#006c4c] font-semibold">
                        ★ {booking.ratingGiven || 5.0} Rated
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Clean empty state for newly registered real customer */
              <div className="bg-[#ffffff] p-8 rounded-2xl border border-dashed border-[#c3c6cf] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#f2f3ff] text-[#12345b] mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">
                    receipt_long
                  </span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                    No past bookings yet
                  </h3>
                  <p className="font-['Inter'] text-xs text-[#43474e] mt-1 max-w-sm mx-auto">
                    Welcome to QuickHelp! Whenever you request a technician, your completed jobs, invoices, and ratings will appear here.
                  </p>
                </div>
                <button
                  onClick={() => handleServiceSelect('Electrician')}
                  className="px-4 py-2 bg-[#006c4c] text-white rounded-xl text-xs font-semibold hover:bg-[#003b2a] transition-colors"
                >
                  Create Your First Request
                </button>
              </div>
            )}
          </div>

          {/* QuickHelp Trust & Hotline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#e9edff] p-5 rounded-2xl flex items-start gap-4 border border-[#d9e2ff]">
              <span className="material-symbols-outlined text-[#006c4c] text-[28px] shrink-0 mt-1">
                verified_user
              </span>
              <div>
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                  The QuickHelp 30-Day Guarantee
                </h4>
                <p className="font-['Inter'] text-xs text-[#43474e] mt-1 leading-relaxed">
                  Every service includes free revisit protection. If an issue reoccurs within 30 days of completion, your technician will rectify it at zero labor charge.
                </p>
              </div>
            </div>

            <div className="bg-[#f2f3ff] p-5 rounded-2xl flex items-start gap-4 border border-[#e1e9e5]">
              <span className="material-symbols-outlined text-[#12345b] text-[28px] shrink-0 mt-1">
                support_agent
              </span>
              <div>
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#001f3f]">
                  Freeganj Ward Support Desk
                </h4>
                <p className="font-['Inter'] text-xs text-[#43474e] mt-1 leading-relaxed">
                  Need custom assistance or have an urgent query? Call your local ward supervisor at <strong>+91 734 2501000</strong> (Toll Free).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
