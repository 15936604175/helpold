import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useDemoStore } from '@/store/useDemoStore';

export function InfoCard({
  icon,
  title,
  value,
  iconColor,
}: {
  icon?: ReactNode;
  title: string;
  value: string;
  iconColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
      {icon && <div style={{ color: iconColor || '#FFA000' }}>{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500">{title}</div>
        <div className="text-sm font-medium text-gray-800 truncate">{value}</div>
      </div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {actions && (
          <div className="flex gap-2 px-4 pb-4">{actions}</div>
        )}
      </div>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useDemoStore((s) => s.toasts);
  const removeToast = useDemoStore((s) => s.removeToast);
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[300px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`
            px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg
            animate-[fadeIn_0.2s_ease-out]
            ${t.type === 'success' ? 'bg-success text-white' : ''}
            ${t.type === 'error' ? 'bg-error text-white' : ''}
            ${t.type === 'info' ? 'bg-gray-800 text-white' : ''}
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, message }: { icon?: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      {icon && <div className="mb-3">{icon}</div>}
      <p className="text-sm text-center whitespace-pre-line">{message}</p>
    </div>
  );
}

export function Chip({
  children,
  color = '#FFA000',
  opacity = 0.2,
}: {
  children: ReactNode;
  color?: string;
  opacity?: number;
}) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`, color }}
    >
      {children}
    </span>
  );
}
