import { useState } from 'react';
import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { Card } from '@/components/CommonUI';
import { users, helperStatuses, helperStatusLabels, mockCurrentLocation } from '@/data/mockData';
import {
  Bell, Settings, MapPin, List, CalendarClock,
  HeartHandshake, Users, History, Fence, ChevronRight,
} from 'lucide-react';

export function HelperHome() {
  const { navigate, helperStatus, setHelperStatus, currentLocation, notifications } = useDemoStore();
  const [tab, setTab] = useState<'help' | 'guardian'>('help');
  const [notifOpen, setNotifOpen] = useState(false);
  const user = users.helper;

  return (
    <div className="min-h-full bg-surface">
      <AppBar
        title={user.nickname}
        actions={
          <>
            <button
              onClick={() => setNotifOpen(true)}
              className="p-2 rounded-full hover:bg-white/20 relative"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-error text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('settings')}
              className="p-2 rounded-full hover:bg-white/20"
            >
              <Settings size={20} />
            </button>
          </>
        }
      />

      {/* Tab Bar */}
      <div className="flex bg-primary">
        <button
          onClick={() => setTab('help')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium transition-colors ${
            tab === 'help' ? 'text-white border-b-2 border-white' : 'text-white/60'
          }`}
        >
          <HeartHandshake size={16} /> 帮助
        </button>
        <button
          onClick={() => setTab('guardian')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium transition-colors ${
            tab === 'guardian' ? 'text-white border-b-2 border-white' : 'text-white/60'
          }`}
        >
          <HeartHandshake size={16} /> 监护
        </button>
      </div>

      {tab === 'help' ? (
        <div className="p-4 space-y-4">
          {/* Status Card */}
          <Card>
            <div className="text-sm font-bold text-gray-800 mb-3">我的状态</div>
            <div className="flex gap-2">
              {helperStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setHelperStatus(status)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    helperStatus === status
                      ? 'bg-primary text-white shadow'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {helperStatusLabels[status]}
                </button>
              ))}
            </div>
          </Card>

          {/* Current Location Card */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <MapPin
                size={20}
                color={currentLocation ? '#4CAF50' : '#BDBDBD'}
              />
              <span className="font-bold text-gray-800 text-sm">
                {currentLocation ? '当前位置（已匹配）' : '当前位置（无匹配）'}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-2">
              {currentLocation ? (
                <div className="space-y-1 text-xs text-gray-600">
                  <div>计划：{currentLocation.planName}</div>
                  <div>地址：{currentLocation.address}</div>
                  <div>时间段：{currentLocation.startTime} - {currentLocation.endTime}</div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-2">
                  当前时间无匹配的位置计划，您不会出现在求助筛选中。
                  <br />请前往"位置计划"添加。
                </p>
              )}
            </div>
          </Card>

          {/* Map Placeholder */}
          <div className="bg-primary-light/20 rounded-xl h-44 flex flex-col items-center justify-center">
            <MapPin size={64} color="#FFA000" />
            <span className="text-xs text-gray-400 mt-2">地图视图</span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('help-list')}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
            >
              <List size={16} /> 附近求助
            </button>
            <button
              onClick={() => navigate('location-schedule')}
              className="flex-1 py-2.5 border border-primary text-primary rounded-lg text-sm font-medium flex items-center justify-center gap-1"
            >
              <CalendarClock size={16} /> 位置计划
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-800">监护面板</span>
          </div>

          <Card className="flex items-center gap-3 cursor-pointer" >
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users size={20} color="#FFA000" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">患者列表与追踪</div>
              <div className="text-xs text-gray-500">查看已绑定患者，发起位置追踪</div>
            </div>
            <ChevronRight size={18} className="text-gray-400" onClick={() => navigate('guardian-panel')} />
          </Card>

          <Card className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <History size={20} color="#FFA000" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">追踪历史</div>
              <div className="text-xs text-gray-500">查看历史追踪记录</div>
            </div>
            <ChevronRight size={18} className="text-gray-400" onClick={() => navigate('guardian-panel')} />
          </Card>

          <Card className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Fence size={20} color="#FFA000" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">电子围栏配置</div>
              <div className="text-xs text-gray-500">设置患者安全区域</div>
            </div>
            <ChevronRight size={18} className="text-gray-400" onClick={() => navigate('geofence-config')} />
          </Card>
        </div>
      )}

      {/* Notifications Modal */}
      {notifOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setNotifOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[375px] rounded-t-2xl p-4 max-h-[60%] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">通知</h3>
              <button onClick={() => setNotifOpen(false)} className="text-xs text-primary">清空</button>
            </div>
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <SosIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{n.title}</div>
                    <div className="text-xs text-gray-500">{n.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SosIcon({ type }: { type: string }) {
  if (type === 'help_request') return <Bell size={18} color="#D32F2F" />;
  if (type === 'accepted') return <span className="text-success">✓</span>;
  return <Bell size={18} color="#FFA000" />;
}
