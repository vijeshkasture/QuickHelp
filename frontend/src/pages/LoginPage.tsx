import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuickHelpLogo } from '../components/Logo';
import { UserAccount } from '../types';
import { loginWithCredentials } from '../services/storage';

interface LoginPageProps {
  currentUser?: UserAccount | null;
  onUserChange?: (user: UserAccount | null) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onUserChange }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or mobile number');
      return;
    }

    const user = loginWithCredentials(identifier);

    if (!user) {
      setError(
        'No matching account found. Please check your email or mobile number, or sign up for an account.'
      );
      return;
    }

    if (onUserChange) onUserChange(user);

    // Route dynamically based on user's saved role
    if (user.role === 'customer') {
      navigate('/customer/dashboard');
    } else {
      navigate('/worker/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header Logo */}
      <div className="flex justify-center">
        <Link to="/">
          <QuickHelpLogo size="lg" />
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto bg-[#ffffff] p-8 rounded-3xl shadow-[0_4px_24px_rgba(18,52,91,0.08)] border border-[#e1e9e5]/80 my-8">
        <div className="text-center mb-6">
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#001f3f]">
            Welcome Back
          </h2>
          <p className="font-['Inter'] text-sm text-[#43474e] mt-1.5">
            Enter your mobile number or email to access your account
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
            <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1.5">
              Phone Number or Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#74777f] text-[18px]">
                person
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9826012345 or user@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
              />
            </div>
          </div>

          <div>
            <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#74777f] text-[18px]">
                lock
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-[#006c4c] focus:ring-[#006c4c] border-[#c3c6cf]"
              />
              <span className="text-[#43474e] font-medium">Remember me</span>
            </label>
            <a href="#forgot" className="text-[#006c4c] font-semibold hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#006c4c] hover:bg-[#003b2a] text-white font-['Inter'] font-semibold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 mt-2"
          >
            <span>Sign In</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>



        {/* Sign up Link */}
        <div className="mt-6 text-center text-xs text-[#43474e]">
          Don't have an account?{' '}
          <Link to="/select-role" className="font-bold text-[#006c4c] hover:underline">
            Sign up now
          </Link>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center font-['Inter'] text-[11px] text-[#74777f]">
        By signing in, you agree to QuickHelp's Terms of Service and Privacy Policy.
      </div>
    </div>
  );
};
