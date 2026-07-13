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
import { Heart, ArrowRight, ShieldCheck, Users, Sparkles } from 'lucide-react';
import type { PageName } from '@/types';
import helpIllustration from '@/assets/help2.png';

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

const features = [
  { icon: Heart, title: '互助友爱', desc: '传递善意，温暖彼此' },
  { icon: ShieldCheck, title: '安全可靠', desc: '严格审核，隐私保护' },
  { icon: Users, title: '互为家人', desc: '今天帮助他人，明天守护家人' },
];

export default function App() {
  const { page, role } = useDemoStore();
  const statusBarColor = pageStatusBarColors[page] || '#FFA000';

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
      {/* ========== 图片背景层 ========== */}
      <div className="absolute inset-0">
        <img
          src={helpIllustration}
          alt=""
          className="absolute h-full w-auto max-w-none right-0 top-0 object-cover opacity-95"
          style={{ objectPosition: 'center top' }}
        />
        {/* 左侧渐变遮罩 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, #FFF8F0 0%, #FFF8F0 28%, rgba(255,248,240,0.88) 44%, rgba(255,248,240,0.55) 56%, rgba(255,248,240,0.2) 70%, transparent 100%)',
          }}
        />
        {/* 底部渐变 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: 'linear-gradient(0deg, #FFF8F0 0%, transparent 100%)' }}
        />
      </div>

      {/* ========== 内容层 ========== */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center px-6 sm:px-10 lg:px-14 py-10 lg:py-12">
        <div className="w-full max-w-[1200px] flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 lg:gap-10">

          {/* ===== 左侧内容 ===== */}
          <div className="flex flex-col w-full lg:max-w-[520px] shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FF8A00 0%, #FF6D00 100%)',
                  boxShadow: '0 6px 20px rgba(255,138,0,0.35)',
                }}
              >
                <Heart size={24} color="white" fill="white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide" style={{ color: '#2D2A26' }}>互佑</h1>
                <p className="text-xs mt-0.5" style={{ color: '#A09890' }}>互助有爱 · 守护每一个家</p>
              </div>
            </div>

            {/* 主标题 —— 让爱 > 有回应 */}
            <h2 className="mb-6 tracking-tight">
              <span className="block text-[56px] sm:text-[64px] font-extrabold leading-none" style={{ color: '#FF8A00' }}>
                让爱
              </span>
              <span className="block text-[38px] sm:text-[42px] font-bold leading-tight mt-1.5" style={{ color: '#2D2A26' }}>
                有回应
              </span>
            </h2>

            {/* 口号 —— 竖线装饰 + 优化颜色 */}
            <div className="flex gap-4 mb-12 max-w-[420px]">
              <div
                className="w-1 shrink-0 rounded-full self-stretch"
                style={{ background: 'linear-gradient(180deg, #FF8A00 0%, #FFCC80 100%)' }}
              />
              <p className="text-[15px] leading-[2.1]" style={{ color: '#8A8078' }}>
                我们相信：今天你伸出的援手，
                <br />
                明天会化作保护你父母的力量。
                <br />
                在这里，我们互为家人。
              </p>
            </div>

            {/* Feature Cards */}
            <div className="flex flex-wrap gap-3 mb-10">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 min-w-[148px] transition-all hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(255,255,255,0.72)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(240,230,220,0.6)',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FFE0B2 0%, #FFCC80 100%)' }}
                    >
                      <Icon size={16} style={{ color: '#E65100' }} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold leading-tight" style={{ color: '#2D2A26' }}>{f.title}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: '#A09890' }}>{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons —— 移到最下方 */}
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-full text-white text-sm font-semibold transition-all hover:scale-[1.04] active:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #FF8A00 0%, #FF6D00 100%)',
                  boxShadow: '0 6px 22px rgba(255,138,0,0.32)',
                }}
              >
                立即加入
                <Heart size={15} fill="white" />
              </button>
              <button
                className="group flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-sm font-semibold transition-all hover:scale-[1.04] active:scale-100 shadow-sm"
                style={{ color: '#7A7168', border: '1px solid #EFE6DC' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF8A00';
                  e.currentTarget.style.color = '#FF8A00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#EFE6DC';
                  e.currentTarget.style.color = '#7A7168';
                }}
              >
                了解更多
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* ===== 右侧手机 ===== */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              <div
                className="absolute -inset-10 rounded-[80px] pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,138,0,0.1) 0%, rgba(255,248,240,0.5) 60%, transparent 80%)',
                }}
              />
              <div className="relative">
                <PhoneFrame statusBarColor={statusBarColor}>
                  {renderPage(page)}
                </PhoneFrame>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="mt-5 flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles size={13} style={{ color: '#FF8A00' }} />
                <span className="text-xs" style={{ color: '#B0A89E' }}>
                  选择角色，体验不同功能
                </span>
              </div>
              <RoleSwitcher />
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      <ToastContainer />
    </div>
  );
}
