import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#f2f3ff] border-t border-[#e1e9e5]/60 py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand statement */}
        <div className="flex items-center gap-3">
          <span className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#001f3f]">
            QuickHelp
          </span>
          <span className="text-[#c3c6cf] text-[14px]">•</span>
          <span className="font-['Inter'] text-[14px] text-[#43474e]">
            Connecting Work. Connecting People.
          </span>
        </div>

        {/* Hyperlink anchors */}
        <div className="flex items-center gap-6 font-['Inter'] text-[13px] font-semibold text-[#43474e]">
          <Link to="/" className="hover:text-[#0d1b36] transition-colors">
            30-Day Guarantee
          </Link>
          <Link to="/" className="hover:text-[#0d1b36] transition-colors">
            Hyperlocal Support
          </Link>
          <Link to="/" className="hover:text-[#0d1b36] transition-colors">
            Privacy & Terms
          </Link>
        </div>

        {/* Copyright */}
        <div className="font-['Inter'] text-[13px] text-[#43474e]">
          © 2024 QuickHelp Technologies India.
        </div>
      </div>
    </footer>
  );
};
