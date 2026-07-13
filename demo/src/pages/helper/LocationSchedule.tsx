import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { Card, EmptyState } from '@/components/CommonUI';
import { RefreshCw, MapPin, Info, Plus, MapPinOff } from 'lucide-react';
import { mockCurrentLocation } from '@/data/mockData';

const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function LocationSchedule() {
  const { navigate, schedules, toggleSchedule, showToast } = useDemoStore();

  // Group by day of week
  const grouped: Record<number, typeof schedules> = {};
  schedules.forEach((s) => {
    if (!grouped[s.dayOfWeek]) grouped[s.dayOfWeek] = [];
    grouped[s.dayOfWeek].push(s);
  });
  const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-full bg-surface">
      <AppBar
        title="位置计划"
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

      <div className="p-4 space-y-4">
        {/* Info Card */}
        <div className="bg-primary/10 rounded-xl p-3 flex items-start gap-2">
          <Info size={18} color="#FFA000" className="flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700">
            类比打车软件选上车点：位置可随意填写，不必是真实住址。系统根据当前时间自动匹配位置，用于求助距离筛选。
          </p>
        </div>

        {/* Current Matched Location */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={20} color="#4CAF50" />
            <span className="font-bold text-gray-800 text-sm">当前位置（已匹配）</span>
          </div>
          <div className="border-t border-gray-100 pt-2 space-y-1">
            <div className="flex text-xs">
              <span className="w-20 text-gray-500">计划名称</span>
              <span className="text-gray-800">{mockCurrentLocation.planName}</span>
            </div>
            <div className="flex text-xs">
              <span className="w-20 text-gray-500">地址</span>
              <span className="text-gray-800">{mockCurrentLocation.address}</span>
            </div>
            <div className="flex text-xs">
              <span className="w-20 text-gray-500">时间段</span>
              <span className="text-gray-800">{mockCurrentLocation.startTime} - {mockCurrentLocation.endTime}</span>
            </div>
            <div className="flex text-xs">
              <span className="w-20 text-gray-500">坐标</span>
              <span className="text-gray-800">
                {mockCurrentLocation.latitude.toFixed(4)}, {mockCurrentLocation.longitude.toFixed(4)}
              </span>
            </div>
          </div>
          <button
            onClick={() => showToast('已重新计算位置', 'success')}
            className="mt-3 flex items-center gap-1 text-xs text-primary border border-primary px-3 py-1.5 rounded-lg"
          >
            <RefreshCw size={14} /> 重新计算
          </button>
        </Card>

        {/* Schedule List */}
        <div>
          <div className="font-bold text-gray-800 text-sm mb-2">我的位置计划</div>
          {sortedDays.length === 0 ? (
            <EmptyState message="还没有位置计划" />
          ) : (
            sortedDays.map((day) => (
              <div key={day} className="mb-3">
                <div className="text-primary font-bold text-xs py-1">
                  {dayLabels[day]}
                </div>
                {grouped[day]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((s) => (
                    <Card key={s.id} className="mb-2">
                      <div className="flex items-center gap-2">
                        {s.enabled ? (
                          <MapPin size={20} color="#FFA000" />
                        ) : (
                          <MapPinOff size={20} color="#BDBDBD" />
                        )}
                        <span
                          className={`flex-1 text-sm font-medium ${
                            s.enabled ? 'text-gray-800' : 'text-gray-400'
                          }`}
                        >
                          {s.name}
                        </span>
                        <button
                          onClick={() => toggleSchedule(s.id)}
                          className={`w-10 h-6 rounded-full transition-colors relative ${
                            s.enabled ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              s.enabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-7">
                        {s.startTime} - {s.endTime}  {s.address}
                      </div>
                    </Card>
                  ))}
              </div>
            ))
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={() => showToast('添加位置计划（Demo演示）', 'info')}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
        >
          <Plus size={18} /> 添加位置计划
        </button>
      </div>
    </div>
  );
}
