import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export const QuickHelpLogo: React.FC<LogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  variant = 'light',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-[18px]',
    md: 'text-[20px]',
    lg: 'text-[24px]',
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Sleek geometric fusion icon of pin, bolt, and handshake */}
      <div
        className={`${iconSizes[size]} rounded-lg bg-[#12345b] flex items-center justify-center shadow-sm relative overflow-hidden flex-shrink-0`}
      >
        {/* Subtle interior glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#12345b] via-[#12345b] to-[#10a879]/30" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 relative z-10"
        >
          {/* Lightning bolt / quick-spark intertwined */}
          <path
            d="M13 2L4 13.5H11.5L10 22L20 10.5H12.5L14.5 2H13Z"
            fill="#7bfac4"
            fillOpacity="0.95"
          />
          {/* Subtle civic shield dot */}
          <circle cx="17.5" cy="5.5" r="2" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center">
          <span
            className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-tight ${textSizes[size]} ${
              variant === 'dark' ? 'text-white' : 'text-[#001f3f]'
            }`}
          >
            Quick<span className="text-[#006c4c]">Help</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10a879] ml-0.5 inline-block" />
        </div>
      )}
    </div>
  );
};
