import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { UserAccount } from '../types';

interface LandingPageProps {
  currentUser?: UserAccount | null;
  onUserChange?: (user: UserAccount | null) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ currentUser, onUserChange }) => {

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <Header currentUser={currentUser} onUserChange={onUserChange} />

      <main className="w-full pt-16 flex-1">

        {/* HERO SECTION */}
        <section className="relative w-full bg-[#faf8ff] py-12 md:py-20 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Typography & CTAs */}
              <div className="lg:col-span-7 flex flex-col items-start gap-6">
                {/* Community Badge or Logged In User Profile Banner */}
                {currentUser ? (
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#f2f3ff] border border-[#e1e9e5] rounded-2xl shadow-xs">
                    <div className="w-7 h-7 rounded-full bg-[#12345b] text-white flex items-center justify-center font-bold text-xs">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left">
                      <span className="font-['Inter'] text-xs font-bold text-[#001f3f] block">
                        {currentUser.fullName}
                      </span>
                      <span className="font-['Inter'] text-[11px] text-[#006c4c] font-medium block">
                        {currentUser.role === 'customer' ? 'Household / Consumer Account' : `Verified Worker • ${currentUser.primaryTrade || 'Technician'}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#f2f3ff] rounded-full shadow-xs border border-[#e1e9e5]/60">
                    <span className="material-symbols-outlined text-[#006c4c] text-[16px]">
                      verified
                    </span>
                    <span className="font-['Inter'] text-[11px] text-[#006c4c] tracking-wider font-semibold uppercase">
                      Local Services. Stronger Communities.
                    </span>
                  </div>
                )}

                {/* Headline */}
                <div className="flex flex-col gap-2">
                  <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-4xl sm:text-5xl lg:text-[52px] leading-[1.15] text-[#001f3f] tracking-tight">
                    Local Help.<br />
                    <span className="text-[#006c4c]">When You Need It.</span>
                  </h1>
                  <p className="font-['Inter'] text-base md:text-lg text-[#43474e] max-w-xl mt-3 leading-relaxed">
                    Find available local workers for everyday needs or discover nearby work opportunities when you're ready to work.
                  </p>
                </div>

                {/* Dual CTA Action Group */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
                  {currentUser ? (
                    currentUser.role === 'customer' ? (
                      <>
                        <Link
                          to="/customer/dashboard"
                          className="inline-flex items-center justify-center gap-2 font-['Inter'] text-[15px] font-semibold bg-[#006c4c] text-white px-8 py-3.5 rounded-xl shadow-md hover:bg-[#003b2a] transition-all text-center"
                        >
                          <span>Find a Worker</span>
                          <span className="material-symbols-outlined text-[18px]">person_search</span>
                        </Link>
                        <Link
                          to="/customer/dashboard"
                          className="inline-flex items-center justify-center gap-2 font-['Inter'] text-[15px] font-semibold bg-[#ffffff] text-[#12345b] px-8 py-3.5 rounded-xl shadow-sm hover:bg-[#f2f3ff] border border-[#e1e9e5] transition-all text-center"
                        >
                          <span>Go to Dashboard</span>
                          <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/worker/dashboard"
                          className="inline-flex items-center justify-center gap-2 font-['Inter'] text-[15px] font-semibold bg-[#006c4c] text-white px-8 py-3.5 rounded-xl shadow-md hover:bg-[#003b2a] transition-all text-center"
                        >
                          <span>Find Jobs</span>
                          <span className="material-symbols-outlined text-[18px]">work</span>
                        </Link>
                        <Link
                          to="/worker/dashboard"
                          className="inline-flex items-center justify-center gap-2 font-['Inter'] text-[15px] font-semibold bg-[#ffffff] text-[#12345b] px-8 py-3.5 rounded-xl shadow-sm hover:bg-[#f2f3ff] border border-[#e1e9e5] transition-all text-center"
                        >
                          <span>Go to Dashboard</span>
                          <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                        </Link>
                      </>
                    )
                  ) : (
                    <>
                      <Link
                        to="/select-role"
                        className="inline-flex items-center justify-center gap-2 font-['Inter'] text-[15px] font-semibold bg-[#006c4c] text-white px-8 py-3.5 rounded-xl shadow-md hover:bg-[#003b2a] transition-all text-center"
                      >
                        <span>Get Started</span>
                        <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                      </Link>
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 font-['Inter'] text-[15px] font-semibold bg-[#ffffff] text-[#12345b] px-8 py-3.5 rounded-xl shadow-sm hover:bg-[#f2f3ff] border border-[#e1e9e5] transition-all text-center"
                      >
                        <span>Login</span>
                        <span className="material-symbols-outlined text-[18px]">login</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 w-full mt-2 border-t border-[#e1e9e5]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e9edff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                        shield
                      </span>
                    </div>
                    <span className="font-['Inter'] text-[12px] text-[#0d1b36] font-medium leading-tight">
                      Trusted Professionals
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e9edff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                        bolt
                      </span>
                    </div>
                    <span className="font-['Inter'] text-[12px] text-[#0d1b36] font-medium leading-tight">
                      Quick Assistance
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e9edff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                        group
                      </span>
                    </div>
                    <span className="font-['Inter'] text-[12px] text-[#0d1b36] font-medium leading-tight">
                      Stronger Communities
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e9edff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                        near_me
                      </span>
                    </div>
                    <span className="font-['Inter'] text-[12px] text-[#0d1b36] font-medium leading-tight">
                      Local Opportunities
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Humanist Collage & Real-life Domestic Reliability */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="w-full relative">
                  <div className="w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden shadow-xl bg-[#e9edff] border border-[#e1e9e5]">
                    <img
                      className="w-full h-full object-cover"
                      alt="Verified technician"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkSV_ApvSOdpXHjv2dRxPe5uIwhGwYeDgfsnPq-NyupNs4fZ5kKaBCB5nA8eKwAEetjEburSbzMZrRi6UzPIf6JbUtoFjt4-E2vflEkYvqnx2F8rDr3S1W6uIvLKlLOvh3DuObhL53HJagyeWnuvQHcDxVTq9dQzCFPNbedhPW1O02Jf4BS5TfDFKjnD7a8WCPwxjuWuwHls_uL4rPDsT3q51Y-DCfN2pJuXoeACUK"
                    />
                  </div>

                  {/* Floating Verified Metric Card */}
                  <div className="absolute -bottom-6 -left-3 sm:left-4 bg-[#ffffff] p-4 rounded-xl shadow-xl flex items-center gap-3.5 max-w-xs border border-[#e1e9e5]">
                    <div className="w-12 h-12 rounded-lg bg-[#7bfac4] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#002114] text-[26px]">
                        task_alt
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#001f3f]">
                        10,000+
                      </span>
                      <span className="font-['Inter'] text-[12px] text-[#43474e]">
                        Neighborhood tasks completed this month
                      </span>
                    </div>
                  </div>

                  {/* Guarantee Stamp Badge */}
                  <div className="absolute -top-3 -right-3 bg-[#ffffff] px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-[#e1e9e5]">
                    <span className="material-symbols-outlined text-[#006c4c] text-[16px]">
                      verified_user
                    </span>
                    <span className="font-['Inter'] text-[12px] text-[#001f3f] font-semibold">
                      100% Background Checked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 — SERVICES ('What do you need help with?') */}
        <section id="services" className="w-full bg-[#f2f3ff] py-16 md:py-20 border-y border-[#e1e9e5]/60">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="flex flex-col gap-1">
                <span className="font-['Inter'] text-[12px] text-[#006c4c] uppercase tracking-widest font-semibold">
                  Neighborhood Services
                </span>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#001f3f]">
                  What do you need help with?
                </h2>
              </div>
              <p className="font-['Inter'] text-sm md:text-base text-[#43474e] max-w-md">
                Direct connection to certified tradespeople in your ward, ready to assist with transparent benchmark pricing.
              </p>
            </div>

            {/* 8 Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Electrician',
                  price: 'From ₹149',
                  desc: 'Switch, wiring, MCB tripping, and complete light fixture installations.',
                  icon: 'electric_bolt',
                },
                {
                  title: 'Plumber',
                  price: 'From ₹179',
                  desc: 'Leakage fixing, tap replacement, flush cisterns, and pipeline overhaul.',
                  icon: 'plumbing',
                },
                {
                  title: 'Carpenter',
                  price: 'From ₹199',
                  desc: 'Furniture repair, door lock replacements, hinges, and custom woodwork fittings.',
                  icon: 'carpenter',
                },
                {
                  title: 'AC Repair',
                  price: 'From ₹449',
                  desc: 'Jet foam cleaning, cooling issues, gas top-ups, and compressor servicing.',
                  icon: 'mode_fan',
                },
                {
                  title: 'Painter',
                  price: 'From ₹299',
                  desc: 'Minor wall touchups, single room painting, and exterior weatherproofing.',
                  icon: 'format_paint',
                },
                {
                  title: 'Cleaning',
                  price: 'From ₹399',
                  desc: 'Kitchen deep grease removal, bathroom tile scrubbing, and full home care.',
                  icon: 'cleaning_services',
                },
                {
                  title: 'Appliance Repair',
                  price: 'From ₹249',
                  desc: 'Washing machine drum fix, refrigerator cooling fault, and microwave issues.',
                  icon: 'local_laundry_service',
                },
                {
                  title: 'More Tasks',
                  price: 'Custom',
                  desc: 'Helpers, on-demand drivers, garden maintenance, and masonry tasks.',
                  icon: 'apps',
                },
              ].map((service) => (
                <Link
                  key={service.title}
                  to={
                    currentUser
                      ? currentUser.role === 'customer'
                        ? `/customer/matching?service=${encodeURIComponent(service.title)}`
                        : '/worker/dashboard'
                      : '/signup/customer'
                  }
                  className="bg-[#ffffff] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group border border-[#e1e9e5]/60 min-h-[170px]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#12345b] group-hover:bg-[#006c4c] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[22px]">
                        {service.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[17px] text-[#001f3f] group-hover:text-[#006c4c] transition-colors">
                        {service.title}
                      </h3>
                      <p className="font-['Inter'] text-[13px] text-[#43474e] mt-1 leading-relaxed line-clamp-2">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 flex items-center justify-between border-t border-[#f2f3ff] mt-2">
                    <span className="font-['Inter'] text-[12px] text-[#006c4c] font-bold">
                      {service.price}
                    </span>
                    <span className="material-symbols-outlined text-[#74777f] group-hover:translate-x-1 group-hover:text-[#006c4c] transition-all text-[18px]">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2 — HOW IT WORKS */}
        <section id="how-it-works" className="w-full bg-[#faf8ff] py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-['Inter'] text-[12px] text-[#006c4c] uppercase tracking-widest font-semibold">
                Simple & Reliable
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#001f3f] mt-1">
                How QuickHelp Works
              </h2>
              <p className="font-['Inter'] text-sm md:text-base text-[#43474e] mt-2">
                Zero guesswork. From transparent quotes to OTP-verified job completion in four easy steps.
              </p>
            </div>

            {/* 4-step progressive timeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Request',
                  icon: 'edit_note',
                  desc: 'Tell us what you need. Select your problem category and preferred arrival time with ease.',
                },
                {
                  step: '02',
                  title: 'Recommended Price',
                  icon: 'price_check',
                  desc: 'See a fair, transparent price benchmark based on verified completed local jobs in your area.',
                },
                {
                  step: '03',
                  title: 'Match',
                  icon: 'person_pin_circle',
                  desc: 'QuickHelp finds suitable, background-verified available workers nearest to you in real-time.',
                },
                {
                  step: '04',
                  title: 'Complete',
                  icon: 'verified',
                  desc: 'Get the work done, verify completion with a secure OTP, and rate your neighborhood technician.',
                },
              ].map((st) => (
                <div
                  key={st.step}
                  className="bg-[#ffffff] p-6 rounded-2xl shadow-xs border border-[#e1e9e5]/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#006c4c]">
                        {st.step}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#12345b]">
                        <span className="material-symbols-outlined text-[20px]">
                          {st.icon}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-[17px] text-[#001f3f] mb-2">
                      {st.title}
                    </h4>
                    <p className="font-['Inter'] text-[13px] text-[#43474e] leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 & 4 — FOR CUSTOMERS & FOR WORKERS (Dual Value Proposition) */}
        <section className="w-full bg-[#f2f3ff] py-16 md:py-20 border-t border-[#e1e9e5]/60">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="font-['Inter'] text-[12px] text-[#006c4c] uppercase tracking-widest font-semibold">
                Built For Everyone
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#001f3f] mt-1">
                Choose How You QuickHelp
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: For Customers */}
              <div className="bg-[#ffffff] p-8 rounded-2xl shadow-sm border border-[#e1e9e5]/60 flex flex-col justify-between">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#12345b]">
                      <span className="material-symbols-outlined text-[28px]">
                        home_repair_service
                      </span>
                    </div>
                    <span className="px-3.5 py-1 bg-[#f2f3ff] text-[#12345b] rounded-full font-['Inter'] text-[12px] font-semibold">
                      For Households
                    </span>
                  </div>
                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                      Need help nearby?
                    </h3>
                    <p className="font-['Inter'] text-sm md:text-base text-[#43474e] mt-2 leading-relaxed">
                      Connect directly with trusted neighborhood professionals without middlemen or hidden fees.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    {[
                      'Describe your work & receive upfront benchmark pricing',
                      'Match with certified, verified local workers in minutes',
                      'Live arrival updates right to your doorstep',
                      'Pay securely only upon full satisfaction via OTP',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[#006c4c] text-[18px] shrink-0">
                          check_circle
                        </span>
                        <span className="font-['Inter'] text-[14px] text-[#0d1b36]">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    to={currentUser ? (currentUser.role === 'customer' ? '/customer/dashboard' : '/worker/dashboard') : '/signup/customer'}
                    className="w-full inline-flex items-center justify-center gap-2 font-['Inter'] text-[14px] font-semibold bg-[#006c4c] text-white px-6 py-3.5 rounded-xl shadow-sm hover:bg-[#003b2a] transition-all"
                  >
                    <span>Find a Worker</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Card 2: For Workers */}
              <div className="bg-[#ffffff] p-8 rounded-2xl shadow-sm border border-[#e1e9e5]/60 flex flex-col justify-between">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#12345b]">
                      <span className="material-symbols-outlined text-[28px]">
                        construction
                      </span>
                    </div>
                    <span className="px-3.5 py-1 bg-[#7bfac4]/30 text-[#007351] rounded-full font-['Inter'] text-[12px] font-semibold">
                      For Technicians
                    </span>
                  </div>
                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-[#001f3f]">
                      Ready to work?
                    </h3>
                    <p className="font-['Inter'] text-sm md:text-base text-[#43474e] mt-2 leading-relaxed">
                      Take control of your daily schedule and earn directly with respect, fair payouts, and local pride.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    {[
                      'Create your digital profile & trade skill certification',
                      'Set your exact preferred service radius (1-25 km)',
                      'Toggle to Available when ready to take nearby jobs',
                      'Instant guaranteed payouts and build a high trust rating',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[#006c4c] text-[18px] shrink-0">
                          check_circle
                        </span>
                        <span className="font-['Inter'] text-[14px] text-[#0d1b36]">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    to={currentUser ? (currentUser.role === 'worker' ? '/worker/dashboard' : '/customer/dashboard') : '/signup/worker'}
                    className="w-full inline-flex items-center justify-center gap-2 font-['Inter'] text-[14px] font-semibold bg-[#12345b] text-white px-6 py-3.5 rounded-xl shadow-sm hover:bg-[#001f3f] transition-all"
                  >
                    <span>Find Work</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — FINAL CALL TO ACTION */}
        <section className="w-full bg-[#faf8ff] py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8">
            <div className="bg-[#12345b] text-white p-8 md:p-14 rounded-3xl shadow-xl relative overflow-hidden flex flex-col items-center text-center">
              <div className="relative z-10 max-w-2xl flex flex-col items-center gap-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 rounded-full text-[#7bfac4] font-['Inter'] text-[12px] font-semibold backdrop-blur-xs">
                  <span className="material-symbols-outlined text-[16px]">handshake</span>
                  <span>Hyperlocal Network</span>
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
                  Connecting Work.<br />Connecting People.
                </h2>
                <p className="font-['Inter'] text-sm md:text-base text-[#d9e2ff] max-w-lg leading-relaxed">
                  QuickHelp makes local work easier to discover, coordinate, and complete. Join thousands of verified users in your area today.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
                  {currentUser ? (
                    currentUser.role === 'customer' ? (
                      <>
                        <Link
                          to="/customer/dashboard"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-['Inter'] text-[14px] font-semibold bg-[#006c4c] text-white px-8 py-3.5 rounded-xl shadow-md hover:bg-[#003b2a] transition-all"
                        >
                          <span>Find a Worker</span>
                          <span className="material-symbols-outlined text-[18px]">person_search</span>
                        </Link>
                        <Link
                          to="/customer/dashboard"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-['Inter'] text-[14px] font-semibold bg-[#ffffff] text-[#12345b] px-8 py-3.5 rounded-xl shadow-md hover:bg-[#f2f3ff] transition-all"
                        >
                          <span>Go to Dashboard</span>
                          <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/worker/dashboard"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-['Inter'] text-[14px] font-semibold bg-[#006c4c] text-white px-8 py-3.5 rounded-xl shadow-md hover:bg-[#003b2a] transition-all"
                        >
                          <span>Find Jobs</span>
                          <span className="material-symbols-outlined text-[18px]">work</span>
                        </Link>
                        <Link
                          to="/worker/dashboard"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-['Inter'] text-[14px] font-semibold bg-[#ffffff] text-[#12345b] px-8 py-3.5 rounded-xl shadow-md hover:bg-[#f2f3ff] transition-all"
                        >
                          <span>Go to Dashboard</span>
                          <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                        </Link>
                      </>
                    )
                  ) : (
                    <>
                      <Link
                        to="/signup/customer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-['Inter'] text-[14px] font-semibold bg-[#006c4c] text-white px-8 py-3.5 rounded-xl shadow-md hover:bg-[#003b2a] transition-all"
                      >
                        <span>I Need a Worker</span>
                        <span className="material-symbols-outlined text-[18px]">person_search</span>
                      </Link>
                      <Link
                        to="/signup/worker"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-['Inter'] text-[14px] font-semibold bg-[#ffffff] text-[#12345b] px-8 py-3.5 rounded-xl shadow-md hover:bg-[#f2f3ff] transition-all"
                      >
                        <span>I Want to Work</span>
                        <span className="material-symbols-outlined text-[18px]">build</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
