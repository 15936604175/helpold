import { useEffect, useState } from 'react';
import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { Siren, X } from 'lucide-react';
import { mockHelpRequests } from '@/data/mockData';

export function HelpPending() {
  const { navigate, cancelHelp, showToast } = useDemoStore();
  const [accepted, setAccepted] = useState(false);

  const request = mockHelpRequests[0];

  useEffect(() => {
    // Simulate helper accepting after 5 seconds
    const timer = setTimeout(() => {
      setAccepted(true);
      showToast('志愿者李 已接单，正在赶来', 'success');
    }, 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleCancel = () => {
    cancelHelp(request.id);
    showToast('求助已取消', 'info');
    navigate('sos-home');
  };

  if (accepted) {
    return (
      <div className="min-h-full bg-surface">
        <AppBar
          title="求助详情"
          onBack={() => navigate('sos-home')}
      />
        <div className="flex flex-col items-center px-4 py-8">
          <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-4">
            <span className="text-success text-3xl">✓</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">帮助者已接单</h2>
          <p className="text-sm text-gray-500 mb-6">志愿者李 正在赶来帮助您</p>

          <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">李</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">志愿者李</div>
                <div className="text-xs text-gray-500">帮助者 · 距离约350米</div>
              </div>
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              求助原因：{request.reason}
            </div>
          </div>

          <button
            onClick={() => navigate('sos-home')}
            className="mt-6 w-full py-3 bg-primary text-white rounded-lg font-medium text-sm"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface">
      <AppBar
        title="求助中"
        onBack={() => navigate('sos-home')}
      />
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: '#D32F2F' }}
          />
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(211, 47, 47, 0.15)' }}
          >
            <Siren size={50} color="#D32F2F" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">已通知附近帮助者</h2>
        <p className="text-sm text-gray-500 mb-2">
          求助原因：{request.reason}
        </p>

        <div className="mt-8 flex items-center gap-2 text-gray-400">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">正在等待帮助者响应...</span>
        </div>

        <button
          onClick={handleCancel}
          className="mt-12 w-full max-w-[280px] py-3 border-2 border-error text-error rounded-lg font-medium text-sm"
        >
          取消求助
        </button>
      </div>
    </div>
  );
}
