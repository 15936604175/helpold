import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { Card } from '@/components/CommonUI';
import { users } from '@/data/mockData';
import {
  User, CalendarClock, Radar, Fence,
  Info, Server, ChevronRight, LogOut,
} from 'lucide-react';

const roleLabels: Record<string, string> = {
  seeker: '求助者',
  helper: '帮助者',
  guardian: '紧急联系人',
};

export function Settings() {
  const { role, setRole, navigate, showToast } = useDemoStore();
  const user = users[role];

  const handleModeSwitch = (newRole: typeof role) => {
    setRole(newRole);
    showToast(`已切换到${roleLabels[newRole]}模式`, 'success');
  };

  const handleLogout = () => {
    showToast('已退出登录（Demo演示）', 'info');
  };

  return (
    <div className="min-h-full bg-surface">
      <AppBar title="设置" onBack={() => {
        if (role === 'seeker') navigate('sos-home');
        else navigate('helper-home');
      }} />

      <div className="p-4 space-y-4">
        {/* User Info Card */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {user.nickname[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">{user.nickname}</div>
              <div className="text-xs text-gray-500">{user.phone}</div>
              <span className="inline-block mt-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
        </Card>

        {/* Mode Switch */}
        <div>
          <div className="font-bold text-gray-800 text-sm mb-2">界面模式</div>
          <Card className="p-0 overflow-hidden">
            <button
              onClick={() => handleModeSwitch('seeker')}
              className={`w-full flex items-center px-4 py-3 text-left border-b border-gray-100 ${
                role === 'seeker' ? 'bg-primary/5' : ''
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                role === 'seeker' ? 'border-primary bg-primary' : 'border-gray-300'
              }`}>
                {role === 'seeker' && <span className="text-white text-xs flex items-center justify-center h-full">✓</span>}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">求助者模式</div>
                <div className="text-xs text-gray-500">SOS 求助、追踪确认</div>
              </div>
            </button>
            <button
              onClick={() => handleModeSwitch('helper')}
              className={`w-full flex items-center px-4 py-3 text-left ${
                role === 'helper' || role === 'guardian' ? 'bg-primary/5' : ''
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                role === 'helper' || role === 'guardian' ? 'border-primary bg-primary' : 'border-gray-300'
              }`}>
                {(role === 'helper' || role === 'guardian') && <span className="text-white text-xs flex items-center justify-center h-full">✓</span>}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">帮助者/监护模式</div>
                <div className="text-xs text-gray-500">接单帮助、监护追踪</div>
              </div>
            </button>
          </Card>
        </div>

        {/* Personal Info */}
        <div>
          <div className="font-bold text-gray-800 text-sm mb-2">个人信息</div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <User size={18} color="#FFA000" />
              <span className="text-sm text-gray-500">昵称</span>
              <span className="ml-auto text-sm text-gray-800">{user.nickname}</span>
            </div>
          </div>
        </div>

        {/* Role-specific Settings */}
        {(role === 'helper' || role === 'guardian') && (
          <div>
            <div className="font-bold text-gray-800 text-sm mb-2">帮助者设置</div>
            <Card className="p-0 overflow-hidden">
              <button
                onClick={() => navigate('location-schedule')}
                className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50"
              >
                <CalendarClock size={18} color="#FFA000" />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-800">位置计划</div>
                  <div className="text-xs text-gray-500">设置各时间段的位置</div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </Card>
          </div>
        )}

        {role === 'seeker' && user.disabilityType === '老年痴呆' && (
          <div>
            <div className="font-bold text-gray-800 text-sm mb-2">追踪设置</div>
            <Card className="p-0 overflow-hidden">
              <button className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100">
                <Radar size={18} color="#FFA000" />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-800">追踪配置</div>
                  <div className="text-xs text-gray-500">持续追踪、上报频率</div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
              <button
                onClick={() => navigate('geofence-config')}
                className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50"
              >
                <Fence size={18} color="#FFA000" />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-800">电子围栏</div>
                  <div className="text-xs text-gray-500">安全区域设置</div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </Card>
          </div>
        )}

        {/* About */}
        <div>
          <div className="font-bold text-gray-800 text-sm mb-2">关于</div>
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <Info size={18} color="#FFA000" />
              <span className="ml-3 text-sm text-gray-700">版本</span>
              <span className="ml-auto text-sm text-gray-400">1.0.0</span>
            </div>
            <div className="flex items-center px-4 py-3">
              <Server size={18} color="#FFA000" />
              <div className="ml-3 flex-1">
                <div className="text-sm text-gray-700">服务器地址</div>
                <div className="text-xs text-gray-400">https://api.helpold.com</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 border-2 border-error text-error rounded-lg font-medium text-sm"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
