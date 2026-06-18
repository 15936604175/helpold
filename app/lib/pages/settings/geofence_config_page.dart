import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 电子围栏配置页 - 设置安全区域中心点、半径、启用/禁用
class GeofenceConfigPage extends StatefulWidget {
  const GeofenceConfigPage({super.key});

  @override
  State<GeofenceConfigPage> createState() => _GeofenceConfigPageState();
}

class _GeofenceConfigPageState extends State<GeofenceConfigPage> {
  Geofence? _geofence;
  bool _loading = true;
  bool _saving = false;
  late TextEditingController _latCtrl;
  late TextEditingController _lonCtrl;
  late TextEditingController _radiusCtrl;
  List<LocationHistory> _history = [];
  List<GeofenceAlert> _alerts = [];

  @override
  void initState() {
    super.initState();
    _latCtrl = TextEditingController();
    _lonCtrl = TextEditingController();
    _radiusCtrl = TextEditingController(text: '500');
    _load();
  }

  @override
  void dispose() {
    _latCtrl.dispose();
    _lonCtrl.dispose();
    _radiusCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final user = appProvider.user;
    if (user == null) {
      setState(() => _loading = false);
      return;
    }
    final fenceRes = await GeofenceService().getGeofence(user.id);
    final historyRes = await GeofenceService().getLocationHistory(user.id);
    final alertsRes = await GeofenceService().getAlerts(user.id);

    if (fenceRes.success && fenceRes.data['geofence'] != null && mounted) {
      _geofence = Geofence.fromJson(
          fenceRes.data['geofence'] as Map<String, dynamic>);
      _latCtrl.text = _geofence!.latitude.toString();
      _lonCtrl.text = _geofence!.longitude.toString();
      _radiusCtrl.text = _geofence!.radius.toString();
    } else {
      // 默认值
      _latCtrl.text = AppConfig.defaultLatitude.toString();
      _lonCtrl.text = AppConfig.defaultLongitude.toString();
    }

    if (historyRes.success && mounted) {
      _history = (historyRes.data['history'] as List? ?? [])
          .map((h) => LocationHistory.fromJson(h as Map<String, dynamic>))
          .toList();
    }
    if (alertsRes.success && mounted) {
      _alerts = (alertsRes.data['alerts'] as List? ?? [])
          .map((a) => GeofenceAlert.fromJson(a as Map<String, dynamic>))
          .toList();
    }

    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    final user = appProvider.user;
    if (user == null) return;
    final lat = double.tryParse(_latCtrl.text);
    final lon = double.tryParse(_lonCtrl.text);
    final radius = int.tryParse(_radiusCtrl.text) ?? 500;
    if (lat == null || lon == null) {
      CommonWidgets.showSnackBar(context, '坐标格式错误', isError: true);
      return;
    }

    setState(() => _saving = true);
    final res = await GeofenceService().updateGeofence(
      userId: user.id,
      latitude: lat,
      longitude: lon,
      radius: radius,
    );
    setState(() => _saving = false);

    if (res.success && mounted) {
      CommonWidgets.showSnackBar(context, '围栏已更新', isSuccess: true);
      _load();
    } else if (mounted) {
      CommonWidgets.showSnackBar(context, '保存失败', isError: true);
    }
  }

  Future<void> _toggleEnabled(bool enabled) async {
    final user = appProvider.user;
    if (user == null) return;
    final res = enabled
        ? await GeofenceService().enableGeofence(user.id)
        : await GeofenceService().disableGeofence(user.id);
    if (res.success && mounted) {
      CommonWidgets.showSnackBar(context, enabled ? '围栏已启用' : '围栏已禁用',
          isSuccess: true);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('电子围栏')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 当前围栏状态
                  Card(
                    child: SwitchListTile(
                      title: const Text('启用电子围栏'),
                      subtitle: Text(
                          _geofence?.enabled == true ? '已启用' : '已禁用'),
                      value: _geofence?.enabled ?? false,
                      onChanged: _toggleEnabled,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // 围栏配置
                  const Text('围栏中心点',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _latCtrl,
                    decoration: const InputDecoration(
                      labelText: '纬度',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.location_on),
                    ),
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _lonCtrl,
                    decoration: const InputDecoration(
                      labelText: '经度',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.location_on),
                    ),
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _radiusCtrl,
                    decoration: const InputDecoration(
                      labelText: '半径（米）',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.fence),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
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
                        : const Text('保存围栏'),
                  ),
                  const SizedBox(height: 24),
                  // 越界警报
                  const Text('越界警报',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (_alerts.isEmpty)
                    Card(
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(
                          child: Text('暂无越界警报',
                              style:
                                  TextStyle(color: AppTheme.textSecondary)),
                        ),
                      ),
                    )
                  else
                    ..._alerts.take(5).map((a) => Card(
                          child: ListTile(
                            leading: const Icon(Icons.warning,
                                color: AppTheme.errorColor),
                            title: Text(
                                a.alertType == 'exit' ? '离开安全区域' : '进入安全区域'),
                            subtitle: Text(formatTime(a.createdAt)),
                          ),
                        )),
                  const SizedBox(height: 16),
                  // 位置历史
                  const Text('最近位置记录',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (_history.isEmpty)
                    Card(
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(
                          child: Text('暂无位置记录',
                              style:
                                  TextStyle(color: AppTheme.textSecondary)),
                        ),
                      ),
                    )
                  else
                    ..._history.take(5).map((h) => Card(
                          child: ListTile(
                            leading: Icon(
                              h.isOutsideGeofence
                                  ? Icons.warning
                                  : Icons.check_circle,
                              color: h.isOutsideGeofence
                                  ? AppTheme.errorColor
                                  : AppTheme.successColor,
                            ),
                            title: Text(
                                '${h.latitude.toStringAsFixed(4)}, ${h.longitude.toStringAsFixed(4)}'),
                            subtitle: Text(formatTime(h.createdAt)),
                          ),
                        )),
                ],
              ),
            ),
    );
  }
}
