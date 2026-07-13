import { useState } from 'react';
import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { InfoCard, Modal } from '@/components/CommonUI';
import { users, helpReasons } from '@/data/mockData';
import { Accessibility, Bell, Settings, Siren, AlertTriangle, ChevronRight } from 'lucide-react';
import { formatTime } from '@/utils/format';

export function SosHome() {
  const { navigate, showToast, notifications } = useDemoStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const user = users.seeker;

  const handleSosClick = () => {
    setCountdown(3);
    setConfirmOpen(true);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setConfirmOpen(false);
          setReasonOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSelectReason = (reason: string) => {
    setReasonOpen(false);
    showToast('求助已发送，已通知 3 位附近帮助者', 'success');
    navigate('help-pending');
  };

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

      <div className="flex flex-col items-center px-4 py-6">
        {/* Tracking status bar (dementia patients) */}
        {user.disabilityType === '老年痴呆' && (
          <div
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-6"
            style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)' }}
          >
            <span className="text-success text-sm">●</span>
            <span className="text-success text-xs flex-1">后台追踪运行中</span>
            <button
              onClick={() => navigate('settings')}
              className="text-primary text-xs font-medium"
            >
              设置
            </button>
          </div>
        )}

        {/* SOS Button */}
        <button
          onClick={handleSosClick}
          className="relative flex flex-col items-center justify-center transition-transform active:scale-95 mt-8 mb-8"
          style={{ width: '220px', height: '220px' }}
        >
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: '#D32F2F' }}
          />
          <div
            className="relative flex flex-col items-center justify-center rounded-full shadow-2xl"
            style={{
              width: '220px',
              height: '220px',
              backgroundColor: '#D32F2F',
              boxShadow: '0 0 30px rgba(211, 47, 47, 0.4)',
            }}
          >
            <Siren size={80} color="white" />
            <span className="text-white text-3xl font-bold tracking-widest mt-1">SOS</span>
            <span className="text-white/70 text-sm mt-1">点击求助</span>
          </div>
        </button>

        {/* User Info */}
        <div className="w-full space-y-2">
          <InfoCard
            icon={<Accessibility size={20} />}
            title="残障类型"
            value={user.disabilityType || '无'}
          />
          {user.disabilityDetail && (
            <InfoCard
              icon={<ChevronRight size={20} />}
              title="详情"
              value={user.disabilityDetail}
            />
          )}
        </div>
      </div>

      {/* SOS Confirm Dialog */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="确认发起求助？"
      >
        <div className="flex flex-col items-center py-4">
          <AlertTriangle size={48} color="#D32F2F" />
          <p className="mt-4 text-gray-600">
            将在 <span className="font-bold text-sos text-lg">{countdown}</span> 秒后自动确认
          </p>
        </div>
      </Modal>

      {/* Reason Picker */}
      <Modal
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title="选择求助原因"
      >
        <div className="space-y-1">
          {helpReasons.map((reason) => (
            <button
              key={reason}
              onClick={() => handleSelectReason(reason)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-left"
            >
              <ChevronRight size={18} className="text-gray-400" />
              <span className="text-sm text-gray-700">{reason}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Notifications */}
      <Modal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="通知"
      >
        {notifications.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">暂无通知</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  {n.type === 'help_request' && <Siren size={18} color="#D32F2F" />}
                  {n.type === 'accepted' && <span className="text-success">✓</span>}
                  {n.type === 'track_request' && <span className="text-info">📍</span>}
                  {n.type === 'cancelled' && <span className="text-error">✕</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{n.title}</div>
                  <div className="text-xs text-gray-500">{n.body}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {formatTime(n.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
