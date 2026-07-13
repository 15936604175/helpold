import { type ReactNode } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
  statusBarColor?: string;
}

export function PhoneFrame({ children, statusBarColor = '#FFA000' }: PhoneFrameProps) {
  return (
    <div className="relative mx-auto" style={{ width: '375px' }}>
      {/* Phone outer frame */}
      <div
        className="relative overflow-hidden bg-black rounded-[3rem] shadow-2xl"
        style={{ width: '375px', height: '812px' }}
      >
        {/* Screen */}
        <div
          className="relative overflow-hidden bg-surface"
          style={{ width: '375px', height: '812px' }}
        >
          {/* Dynamic Island / Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-[120px] h-[34px] bg-black rounded-b-[18px]" />

          {/* Status Bar */}
          <div
            className="flex items-center justify-between px-6 pt-2 pb-1 text-white text-xs font-semibold relative z-40"
            style={{ height: '44px', backgroundColor: statusBarColor }}
          >
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
                <rect x="0" y="6" width="3" height="4" rx="0.5" />
                <rect x="4" y="4" width="3" height="6" rx="0.5" />
                <rect x="8" y="2" width="3" height="8" rx="0.5" />
                <rect x="12" y="0" width="3" height="10" rx="0.5" />
              </svg>
              <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
                <path d="M7.5 0C4.6 0 1.9 1 0 2.7l1.4 1.4C3 2.7 5.2 2 7.5 2s4.5.7 6.1 2.1L15 2.7C13.1 1 10.4 0 7.5 0zM7.5 4C5.4 4 3.5 4.8 2 6.1l1.4 1.4C4.6 6.5 6 6 7.5 6s2.9.5 4.1 1.5L13 6.1C11.5 4.8 9.6 4 7.5 4zM7.5 8C6.1 8 4.9 8.5 4 9.3l3.5 1.7 3.5-1.7C10.1 8.5 8.9 8 7.5 8z" />
              </svg>
              <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
                <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" opacity="0.4" />
                <rect x="2" y="2" width="17" height="7" rx="1.5" fill="currentColor" />
                <rect x="21.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
              </svg>
            </span>
          </div>

          {/* Content Area */}
          <div
            className="overflow-y-auto"
            style={{ height: 'calc(812px - 44px)', scrollbarWidth: 'none' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
