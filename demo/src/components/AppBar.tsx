import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface AppBarProps {
  title: string;
  backgroundColor?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function AppBar({
  title,
  backgroundColor = '#FFA000',
  onBack,
  actions,
}: AppBarProps) {
  return (
    <div
      className="flex items-center px-2 py-2 text-white shadow-sm sticky top-0 z-30"
      style={{ backgroundColor, minHeight: '48px' }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
      ) : (
        <div className="w-10" />
      )}
      <span className="flex-1 text-center text-base font-semibold">{title}</span>
      <div className="flex items-center gap-1">{actions}</div>
    </div>
  );
}
