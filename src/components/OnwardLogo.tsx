import React from 'react';

interface OnwardLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const OnwardLogo: React.FC<OnwardLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7 rounded-lg', svg: 'w-4 h-4', text: 'text-sm', tag: 'text-[9px]' },
    md: { box: 'w-8 h-8 rounded-xl', svg: 'w-5 h-5', text: 'text-base', tag: 'text-[10px]' },
    lg: { box: 'w-14 h-14 rounded-2xl', svg: 'w-8 h-8', text: 'text-2xl', tag: 'text-xs' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon Mark: Squircle with dual green chevrons matching the provided AMOLED logo */}
      <div
        className={`${current.box} bg-[#0e0e11] border border-[#23232a] flex items-center justify-center shrink-0 shadow-sm`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={current.svg}
        >
          {/* Back muted olive chevron */}
          <path d="M5.5 6.5L10 12L5.5 17.5" stroke="#4d7c1b" />
          {/* Front bright lime-green chevron */}
          <path d="M12.5 6.5L17 12L12.5 17.5" stroke="#84cc16" />
        </svg>
      </div>

      {/* Wordmark and Tagline */}
      {(showWordmark || showTagline) && (
        <div className="flex flex-col">
          {showWordmark && (
            <span
              className={`font-bold tracking-tight text-white leading-none ${current.text}`}
            >
              Onward
            </span>
          )}
          {showTagline && (
            <span
              className={`tracking-widest uppercase text-neutral-400 font-medium mt-1 ${current.tag}`}
            >
              One routine at a time
            </span>
          )}
        </div>
      )}
    </div>
  );
};
