import { useDemoStore } from '@/store/useDemoStore';
import { AppBar } from '@/components/AppBar';
import { Card } from '@/components/CommonUI';
import { MapPin, Shield } from 'lucide-react';
import { mockGeofence } from '@/data/mockData';

export function GeofenceConfig() {
  const { navigate, geofence, setGeofenceRadius, toggleGeofence } = useDemoStore();

  return (
    <div className="min-h-full bg-surface">
      <AppBar
        title="电子围栏配置"
        onBack={() => navigate('helper-home')}
      />

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={20} color={geofence.enabled ? '#4CAF50' : '#BDBDBD'} />
            <span className="font-bold text-gray-800 text-sm">围栏状态</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${geofence.enabled ? 'text-success' : 'text-gray-400'}`}>
              {geofence.enabled ? '已启用' : '已关闭'}
            </span>
            <button
              onClick={toggleGeofence}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                geofence.enabled ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  geofence.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Geofence Settings */}
        <Card>
          <div className="text-sm font-bold text-gray-800 mb-3">安全区域设置</div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} color="#FFA000" />
              <span className="text-gray-500">中心点坐标：</span>
              <span className="text-gray-800">{geofence.latitude.toFixed(4)}, {geofence.longitude.toFixed(4)}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">围栏半径</span>
                <span className="text-sm font-bold text-primary">{geofence.radius} 米</span>
              </div>
              <input
                type="range"
                min={100}
                max={2000}
                step={100}
                value={geofence.radius}
                onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>100m</span>
                <span>500m</span>
                <span>1000m</span>
                <span>2000m</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Map Placeholder */}
        <div className="bg-primary-light/20 rounded-xl h-48 flex flex-col items-center justify-center relative">
          <MapPin size={48} color="#FFA000" />
          <span className="text-xs text-gray-400 mt-2">安全区域地图视图</span>
          {/* Radius visualization */}
          <div
            className="absolute rounded-full border-2 border-primary/40 border-dashed"
            style={{
              width: `${Math.min(geofence.radius / 5, 180)}px`,
              height: `${Math.min(geofence.radius / 5, 180)}px`,
            }}
          />
        </div>

        {/* Info */}
        <div className="bg-primary/10 rounded-xl p-3 flex items-start gap-2">
          <span className="text-primary text-sm">ⓘ</span>
          <p className="text-xs text-gray-700">
            患者超出围栏边界后，系统将在连续2次定位确认后发送越界警报通知。
          </p>
        </div>
      </div>
    </div>
  );
}
