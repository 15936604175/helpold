import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { EmptyState, Chip } from '@/components/CommonUI';
import { RefreshCw, Siren } from 'lucide-react';
import { formatTime, formatDistance } from '@/utils/format';

export function HelpList() {
  const { navigate, helpRequests, showToast } = useDemoStore();
  const pendingRequests = helpRequests.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-full bg-surface">
      <AppBar
        title="附近求助"
        onBack={() => navigate('helper-home')}
        actions={
          <button
            onClick={() => showToast('已刷新', 'success')}
            className="p-2 rounded-full hover:bg-white/20"
          >
            <RefreshCw size={20} />
          </button>
        }
      />

      <div className="p-4">
        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={<span className="text-success text-4xl">✓</span>}
            message="附近暂无求助"
          />
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate('help-accept', r.id)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-sos flex items-center justify-center">
                    <Siren size={18} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm">{r.seekerNickname}</div>
                    <div className="text-xs text-gray-500">{formatTime(r.createdAt)}</div>
                  </div>
                  {r.distance && (
                    <Chip color="#FFD54F" opacity={0.3}>
                      {formatDistance(r.distance)}
                    </Chip>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  {r.disabilityType && (
                    <Chip color="#FFA000" opacity={0.2}>
                      {r.disabilityType}
                    </Chip>
                  )}
                  <span className="text-xs text-gray-500 flex-1 truncate">{r.reason}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
