import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 追踪配置页 - 持续追踪开关、上报频率、围栏半径
class TrackingConfigPage extends StatefulWidget {
  const TrackingConfigPage({super.key});

  @override
  State<TrackingConfigPage> createState() => _TrackingConfigPageState();
}

class _TrackingConfigPageState extends State<TrackingConfigPage> {
  bool _continuousTracking = false;
  int _trackingInterval = 600;
  int _geofenceRadius = 500;
  bool _nightMode = true;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    final user = appProvider.user;
    if (user == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() {
      _continuousTracking = user.continuousTracking;
      _trackingInterval = user.trackingInterval;
      _geofenceRadius = user.geofenceRadius;
      _nightMode = user.nightModeEnabled;
      _loading = false;
    });
  }

  Future<void> _save() async {
    final user = appProvider.user;
    if (user == null) return;

    setState(() => _saving = true);
    final res = await TrackingService().updateTrackingConfig(
      userId: user.id,
      continuousTracking: _continuousTracking,
      trackingInterval: _trackingInterval,
      geofenceRadius: _geofenceRadius,
      nightModeEnabled: _nightMode,
    );
    setState(() => _saving = false);

    if (res.success && mounted) {
      appProvider.updateUser(user.copyWith(
        continuousTracking: _continuousTracking,
        trackingInterval: _trackingInterval,
        geofenceRadius: _geofenceRadius,
        nightModeEnabled: _nightMode,
      ));
      CommonWidgets.showSnackBar(context, '配置已保存', isSuccess: true);
    } else if (mounted) {
      CommonWidgets.showSnackBar(context, '保存失败', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('追踪配置')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: SwitchListTile(
                      title: const Text('持续追踪'),
                      subtitle: const Text('开启后按固定频率自动上报位置'),
                      value: _continuousTracking,
                      onChanged: (v) =>
                          setState(() => _continuousTracking = v),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                              '上报频率：${(_trackingInterval / 60).round()} 分钟'),
                          Slider(
                            value: _trackingInterval.toDouble(),
                            min: 300,
                            max: 3600,
                            divisions: 11,
                            label:
                                '${(_trackingInterval / 60).round()} 分钟',
                            onChanged: (v) => setState(
                                () => _trackingInterval = v.round()),
                          ),
                          const Text(
                            '范围：5 - 60 分钟',
                            style: TextStyle(
                                fontSize: 12, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('电子围栏半径：$_geofenceRadius 米'),
                          Slider(
                            value: _geofenceRadius.toDouble(),
                            min: 100,
                            max: 2000,
                            divisions: 19,
                            label: '$_geofenceRadius 米',
                            onChanged: (v) =>
                                setState(() => _geofenceRadius = v.round()),
                          ),
                          const Text(
                            '范围：100 - 2000 米',
                            style: TextStyle(
                                fontSize: 12, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: SwitchListTile(
                      title: const Text('夜间模式'),
                      subtitle: const Text('夜间降低追踪频率以省电'),
                      value: _nightMode,
                      onChanged: (v) => setState(() => _nightMode = v),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _saving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('保存配置'),
                  ),
                ],
              ),
            ),
    );
  }
}
