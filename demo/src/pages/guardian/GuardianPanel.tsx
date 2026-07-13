import { useState } from 'react';
import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { EmptyState, Modal } from '@/components/CommonUI';
import {
  RefreshCw, Radar, MapPin, Clock,
  CheckCircle, Hourglass, XCircle, Plus,
} from 'lucide-react';
import { formatTime, formatCoords } from '@/utils/format';
import { users } from '@/data/mockData';
import type { TrackingStatus } from '@/types';

const statusConfig: Record<TrackingStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  confirmed: { label: '已确认', color: '#4CAF50', icon: CheckCircle },
  pending: { label: '等待中', color: '#FF9800', icon: Hourglass },
  denied: { label: '已拒绝', color: '#E53935', icon: XCircle },
  timeout: { label: '已超时', color: '#BDBDBD', icon: XCircle },
};

export function GuardianPanel() {
  const { navigate, trackingHistory, requestTracking, showToast } = useDemoStore();
  const [refreshing, setRefreshing] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [locationDialog, setLocationDialog] = useState<{ nickname: string; lat: number; lon: number; address: string } | null>(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('已刷新', 'success');
    }, 800);
  };

  const handleRequestTracking = () => {
    setRequestOpen(false);
    requestTracking(users.seeker.id, users.seeker.nickname);
  };

  return (
    <div className="min-h-full bg-surface">
      <AppBar
        title="监护面板"
        onBack={() => navigate('helper-home')}
        actions={
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-full hover:bg-white/20 ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
        }
      />

      <div className="p-4">
        {/* Patient Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">张</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">张大爷</div>
              <div className="text-xs text-gray-500">老年痴呆 · 持续追踪中</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <MapPin size={14} color="#4CAF50" />
            <span>最近位置：北京市朝阳区望京花园小区北门</span>
          </div>
          <button
            onClick={handleRequestTracking}
            className="mt-3 w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <Radar size={16} /> 发起追踪
          </button>
        </div>

        {/* Tracking History */}
        <div className="font-bold text-gray-800 text-sm mb-2">追踪历史</div>
        {trackingHistory.length === 0 ? (
          <EmptyState message="暂无追踪记录" />
        ) : (
          <div className="space-y-2">
            {trackingHistory.map((t) => {
              const config = statusConfig[t.status];
              const Icon = config.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (t.status === 'confirmed' && t.latitude && t.longitude) {
                      setLocationDialog({
                        nickname: t.seekerNickname,
                        lat: t.latitude,
                        lon: t.longitude,
                        address: t.address || '',
                      });
                    }
                  }}
                  className="w-full bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon size={18} color={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm">{t.seekerNickname}</div>
                      <div className="text-xs text-gray-500">
                        状态：{config.label}
                      </div>
                      <div className="text-xs text-gray-400">
                        请求时间：{formatTime(t.requestedAt)}
                      </div>
                      {t.latitude && (
                        <div className="text-xs text-gray-400">
                          位置：{formatCoords(t.latitude, t.longitude!)}
                        </div>
                      )}
                    </div>
                    {t.status === 'confirmed' && t.latitude && (
                      <MapPin size={18} color="#FFA000" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Location Dialog */}
      <Modal
        open={!!locationDialog}
        onClose={() => setLocationDialog(null)}
        title={`${locationDialog?.nickname || ''} 的位置`}
        actions={
          <button
            onClick={() => setLocationDialog(null)}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
          >
            关闭
          </button>
        }
      >
        <div className="flex flex-col items-center py-4">
          <MapPin size={48} color="#FFA000" />
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <div>纬度：{locationDialog?.lat.toFixed(4)}</div>
            <div>经度：{locationDialog?.lon.toFixed(4)}</div>
            <div className="text-xs text-gray-400 mt-2">{locationDialog?.address}</div>
          </div>
          <div className="mt-3 bg-primary-light/20 rounded-xl w-full h-32 flex items-center justify-center">
            <span className="text-xs text-gray-400">地图视图</span>
          </div>
        </div>
      </Modal>

      {/* Request Tracking Dialog */}
      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="发起位置追踪"
        actions={
          <>
            <button
              onClick={() => setRequestOpen(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleRequestTracking}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
            >
              发起
            </button>
          </>
        }
      >
        <div className="space-y-3 py-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">追踪对象</div>
            <div className="text-sm font-medium text-gray-800">张大爷（老年痴呆）</div>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <Clock size={14} className="mt-0.5" />
            <span>患者已开启自动同意追踪，请求将立即返回位置信息</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
