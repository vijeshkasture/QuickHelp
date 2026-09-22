import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuickHelpLogo } from '../components/Logo';
import { UserAccount } from '../types';
import { registerRealCustomer } from '../services/storage';

interface CustomerSignupProps {
  onUserChange?: (user: UserAccount | null) => void;
}

export const CustomerSignupPage: React.FC<CustomerSignupProps> = ({ onUserChange }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    defaultLocation: 'Freeganj, Ujjain, Madhya Pradesh',
    password: '',
    termsAccepted: true,
  });

  const [error, setError] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = () => {
    setDetectingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setFormData((prev) => ({
            ...prev,
            defaultLocation: 'Freeganj Main Road, Ujjain, MP (GPS Verified)',
          }));
          setDetectingLocation(false);
        },
        () => {
          setFormData((prev) => ({
            ...prev,
            defaultLocation: 'Freeganj Sector 2, Ujjain, Madhya Pradesh',
          }));
          setDetectingLocation(false);
        }
      );
    } else {
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          defaultLocation: 'Madhav Nagar & Freeganj, Ujjain, MP',
        }));
        setDetectingLocation(false);
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.termsAccepted) {
      setError('You must accept the terms and safety policy');
      return;
    }

    // Register clean real customer in localStorage
    const newCustomer = registerRealCustomer({
      fullName: formData.fullName,
      email: formData.email,
      mobile: formData.mobile,
      defaultLocation: formData.defaultLocation,
    });

    if (onUserChange) onUserChange(newCustomer);

    // Redirect to customer dashboard with their clean fresh state!
    navigate('/customer/dashboard');
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
      <div className="max-w-lg w-full mx-auto bg-[#ffffff] p-8 md:p-10 rounded-3xl shadow-[0_4px_24px_rgba(18,52,91,0.08)] border border-[#e1e9e5]/80 my-8">
        {/* Step Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/select-role"
            className="flex items-center gap-1 text-xs font-semibold text-[#006c4c] hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Change Role</span>
          </Link>
          <span className="font-['Inter'] text-[12px] font-bold text-[#006c4c] tracking-wider uppercase">
            Step 2 of 2
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#f2f3ff] rounded-full mb-6 overflow-hidden">
          <div className="w-full h-full bg-[#006c4c] rounded-full transition-all" />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f2f3ff] text-[#12345b] rounded-full text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Customer Registration</span>
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#001f3f]">
            Create Your Account
          </h2>
          <p className="font-['Inter'] text-xs text-[#43474e] mt-1.5">
            Book local verified technicians in seconds with transparent pricing
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#ffdad6] text-[#93000a] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#ba1a1a]/20">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Priyanshu Sharma"
              className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                Mobile Number *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl bg-[#e9edff] text-[#0d1b36] text-xs font-semibold border-r border-[#c3c6cf]/30">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9826012345"
                  className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-r-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
                />
              </div>
            </div>

            <div>
              <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36]">
                Default Service Address / Ward
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="text-[11px] font-semibold text-[#006c4c] flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">my_location</span>
                <span>{detectingLocation ? 'Locating...' : 'Use Current GPS'}</span>
              </button>
            </div>
            <input
              type="text"
              value={formData.defaultLocation}
              onChange={(e) => setFormData({ ...formData, defaultLocation: e.target.value })}
              placeholder="e.g. Freeganj, Ujjain, Madhya Pradesh"
              className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
            />
          </div>

          <div>
            <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
              Set Account Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
            />
          </div>

          {/* QuickHelp Guarantee Strip */}
          <div className="p-3 bg-[#e9edff] rounded-xl flex items-start gap-2.5 text-xs text-[#001f3f]">
            <span className="material-symbols-outlined text-[#006c4c] text-[18px] shrink-0 mt-0.5">
              verified_user
            </span>
            <span className="font-['Inter'] leading-relaxed">
              Every job booked through QuickHelp is backed by our <strong>30-Day Workmanship Guarantee</strong> and verified OTP security.
            </span>
          </div>

          <label className="flex items-start gap-2 pt-1 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              className="rounded text-[#006c4c] focus:ring-[#006c4c] border-[#c3c6cf] mt-0.5"
            />
            <span className="text-[#43474e]">
              I agree to the QuickHelp Community Code of Conduct and Service Terms.
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-3 bg-[#006c4c] hover:bg-[#003b2a] text-white font-['Inter'] font-semibold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 mt-2"
          >
            <span>Create Customer Account</span>
            <span className="material-symbols-outlined text-[18px]">check</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#43474e]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#006c4c] hover:underline">
            Log in
          </Link>
        </div>
      </div>

      <div className="text-center font-['Inter'] text-[11px] text-[#74777f]">
        QuickHelp Technologies • Verified Neighborhood Services
      </div>
    </div>
  );
};
