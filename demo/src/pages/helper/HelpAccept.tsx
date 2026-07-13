import { useState } from 'react';
import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { InfoCard, Modal, Card } from '@/components/CommonUI';
import { User, HelpCircle, Accessibility, MapPin, Phone, AlertTriangle } from 'lucide-react';
import { formatTime, formatDistance, formatCoords } from '@/utils/format';

export function HelpAccept() {
  const { navigate, selectedHelpId, helpRequests, acceptHelp } = useDemoStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const request = helpRequests.find((r) => r.id === selectedHelpId) || helpRequests[0];

  const handleAccept = () => {
    setConfirmOpen(false);
    setAccepting(true);
    setTimeout(() => {
      acceptHelp(request.id);
      setAccepting(false);
      navigate('helper-home');
    }, 1000);
  };

  return (
    <div className="min-h-full bg-surface">
      <AppBar
        title="求助详情"
        onBack={() => navigate('help-list')}
      />

      <div className="p-4 space-y-3">
        {/* Seeker Info Card */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-sos flex items-center justify-center">
              <User size={24} color="white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800 text-base">{request.seekerNickname}</div>
              <div className="text-xs text-gray-500">{formatTime(request.createdAt)}</div>
            </div>
            {request.distance && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                距离 {formatDistance(request.distance)}
              </span>
            )}
          </div>
        </Card>

        {/* Help Details */}
        <InfoCard
          icon={<HelpCircle size={20} />}
          title="求助原因"
          value={request.reason}
        />
        <InfoCard
          icon={<Accessibility size={20} />}
          title="残障类型"
          value={request.disabilityType || '无'}
        />
        {request.disabilityDetail && (
          <InfoCard
            icon={<Accessibility size={20} />}
            title="残障详情"
            value={request.disabilityDetail}
          />
        )}
        <InfoCard
          icon={<MapPin size={20} />}
          title="位置坐标"
          value={formatCoords(request.latitude, request.longitude)}
        />
        <InfoCard
          icon={<Phone size={20} />}
          title="联系电话"
          value={request.sharePhone ? (request.seekerPhone || '未提供') : '求助者未公开电话'}
          iconColor={request.sharePhone ? '#4CAF50' : '#BDBDBD'}
        />

        {/* Map Placeholder */}
        <div className="bg-primary-light/20 rounded-xl h-44 flex flex-col items-center justify-center">
          <MapPin size={48} color="#FFA000" />
          <span className="text-xs text-gray-400 mt-2">地图视图</span>
        </div>

        {/* Accept Button */}
        <div className="pt-2">
          {request.status === 'pending' ? (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={accepting}
              className="w-full py-3.5 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  接单中...
                </>
              ) : (
                '接单帮助'
              )}
            </button>
          ) : (
            <div className="bg-warning/15 rounded-lg py-3 px-4 flex items-center justify-center gap-2">
              <AlertTriangle size={18} color="#FF9800" />
              <span className="text-warning text-sm">
                此求助已被接单，无法重复接单
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="确认接单"
        actions={
          <>
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
            >
              确认接单
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600 py-2">
          您将前往帮助 <span className="font-bold">{request.seekerNickname}</span>，确认接单吗？
        </p>
      </Modal>
    </div>
  );
}
