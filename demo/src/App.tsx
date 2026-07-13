import type { ReactNode } from 'react';
import { useDemoStore } from '@/store/useDemoStore';
import { PhoneFrame } from '@/components/PhoneFrame';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ToastContainer } from '@/components/CommonUI';
import { SosHome } from '@/pages/seeker/SosHome';
import { HelpPending } from '@/pages/seeker/HelpPending';
import { HelperHome } from '@/pages/helper/HelperHome';
import { HelpList } from '@/pages/helper/HelpList';
import { HelpAccept } from '@/pages/helper/HelpAccept';
import { LocationSchedule } from '@/pages/helper/LocationSchedule';
import { GuardianPanel } from '@/pages/guardian/GuardianPanel';
import { GeofenceConfig } from '@/pages/guardian/GeofenceConfig';
import { Settings } from '@/pages/Settings';
import { HeartPulse } from 'lucide-react';
import type { PageName } from '@/types';

const pageStatusBarColors: Partial<Record<PageName, string>> = {
  'help-pending': '#D32F2F',
};

function renderPage(page: PageName): ReactNode {
  switch (page) {
    case 'sos-home': return <SosHome />;
    case 'help-pending': return <HelpPending />;
    case 'helper-home': return <HelperHome />;
    case 'help-list': return <HelpList />;
    case 'help-accept': return <HelpAccept />;
    case 'location-schedule': return <LocationSchedule />;
    case 'guardian-panel': return <GuardianPanel />;
    case 'geofence-config': return <GeofenceConfig />;
    case 'settings': return <Settings />;
    default: return <SosHome />;
  }
}

export default function App() {
  const { page, role } = useDemoStore();
  const statusBarColor = pageStatusBarColors[page] || '#FFA000';

  return (
    <div
      className="min-h-screen flex flex-col items-center py-8"
      style={{
        background: 'linear-gradient(135deg, #f5f0e8 0%, #fafafa 50%, #f0f5f8 100%)',
      }}
    >
      {/* Header */}
      <header className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-sos flex items-center justify-center shadow-lg">
            <HeartPulse size={22} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">互助SOS</h1>
        </div>
        <p className="text-sm text-gray-500 mb-4">社区紧急求助平台 · 功能演示</p>
        <RoleSwitcher />
      </header>

      {/* Phone Frame */}
      <PhoneFrame statusBarColor={statusBarColor}>
        {renderPage(page)}
      </PhoneFrame>

      {/* Footer Info */}
      <div className="mt-6 text-center max-w-[375px]">
        <p className="text-xs text-gray-400">
          当前角色：{role === 'seeker' ? '求助者' : role === 'helper' ? '帮助者' : '紧急联系人'}
          {' · '}
          页面：{page}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          点击顶部按钮切换角色体验不同功能
        </p>
      </div>

      {/* Toast */}
      <ToastContainer />
    </div>
  );
}
