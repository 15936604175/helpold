import { useDemoStore } from '@/store/useDemoStore';
import type { Role } from '@/types';
import { Accessibility, Handshake, ShieldCheck } from 'lucide-react';

const roleConfig: Record<Role, { label: string; icon: typeof Accessibility; color: string }> = {
  seeker: { label: '求助者', icon: Accessibility, color: 'bg-sos' },
  helper: { label: '帮助者', icon: Handshake, color: 'bg-primary' },
  guardian: { label: '紧急联系人', icon: ShieldCheck, color: 'bg-info' },
};

export function RoleSwitcher() {
  const { role, setRole } = useDemoStore();

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {(Object.keys(roleConfig) as Role[]).map((r) => {
        const config = roleConfig[r];
        const Icon = config.icon;
        const isActive = role === r;
        return (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${isActive
                ? `${config.color} text-white shadow-lg scale-105`
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200'
              }
            `}
          >
            <Icon size={16} />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
