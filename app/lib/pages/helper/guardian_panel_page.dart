import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 监护面板 - 患者列表、追踪请求、实时位置、历史记录
class GuardianPanelPage extends StatefulWidget {
  const GuardianPanelPage({super.key});

  @override
  State<GuardianPanelPage> createState() => _GuardianPanelPageState();
}

class _GuardianPanelPageState extends State<GuardianPanelPage> {
  List<LocationTracking> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    final res = await TrackingService().getTrackingHistory();
    if (res.success && mounted) {
      setState(() {
        _history = (res.data['history'] as List? ?? [])
            .map((t) => LocationTracking.fromJson(t as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } else if (mounted) {
      setState(() => _loading = false);
    }
  }

  Future<void> _requestTracking(String seekerId, String nickname) async {
    final user = appProvider.user;
    if (user == null) return;

    CommonWidgets.showLoadingDialog(context, message: '正在请求追踪...');
    final res = await TrackingService().requestTracking(
      seekerId: seekerId,
      guardianId: user.id,
    );
    CommonWidgets.hideLoadingDialog(context);

    if (!mounted) return;

    if (res.success) {
      final tracking = res.data['tracking'];
      final status = tracking['status'];
      if (status == 'confirmed') {
        // 自动同意，直接显示位置
        final lat = tracking['latitude'];
        final lon = tracking['longitude'];
        CommonWidgets.showSnackBar(context, '已获取位置', isSuccess: true);
        _showLocationDialog(nickname, lat, lon);
      } else {
        CommonWidgets.showSnackBar(context, '追踪请求已发送，等待患者确认');
      }
      _fetchHistory();
    } else {
      CommonWidgets.showSnackBar(
          context, res.error ?? '请求失败', isError: true);
    }
  }

  void _showLocationDialog(String nickname, double? lat, double? lon) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('$nickname 的位置'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.location_on, size: 48, color: AppTheme.primaryColor),
            const SizedBox(height: 16),
            Text('纬度：${lat?.toStringAsFixed(4) ?? '未知'}'),
            Text('经度：${lon?.toStringAsFixed(4) ?? '未知'}'),
            const SizedBox(height: 16),
            const Text('（地图视图需集成地图插件）',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('监护面板'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _loading = true);
              _fetchHistory();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchHistory,
              child: _history.isEmpty
                  ? CommonWidgets.emptyState(
                      icon: Icons.family_restroom,
                      message: '暂无追踪记录\n请先在首页绑定患者',
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _history.length,
                      itemBuilder: (ctx, index) {
                        final t = _history[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: t.status == 'confirmed'
                                  ? AppTheme.successColor
                                  : t.status == 'pending'
                                      ? AppTheme.warningColor
                                      : AppTheme.textHint,
                              child: Icon(
                                t.status == 'confirmed'
                                    ? Icons.location_on
                                    : t.status == 'pending'
                                        ? Icons.hourglass_empty
                                        : Icons.cancel,
                                color: Colors.white,
                              ),
                            ),
                            title: Text(t.seekerNickname ?? '患者'),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('状态：${t.statusLabel}'),
                                Text('请求时间：${formatTime(t.requestedAt)}'),
                                if (t.latitude != null)
                                  Text(
                                      '位置：${t.latitude!.toStringAsFixed(4)}, ${t.longitude!.toStringAsFixed(4)}'),
                              ],
                            ),
                            isThreeLine: true,
                            trailing: t.status == 'confirmed'
                                ? const Icon(Icons.map, color: AppTheme.primaryColor)
                                : null,
                            onTap: () {
                              if (t.status == 'confirmed' && t.latitude != null) {
                                _showLocationDialog(
                                    t.seekerNickname ?? '患者',
                                    t.latitude,
                                    t.longitude);
                              }
                            },
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showRequestTrackingDialog,
        icon: const Icon(Icons.location_searching),
        label: const Text('发起追踪'),
      ),
    );
  }

  void _showRequestTrackingDialog() {
    final seekerIdCtrl = TextEditingController();
    final nicknameCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('发起位置追踪'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nicknameCtrl,
              decoration: const InputDecoration(
                labelText: '患者昵称（备注）',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: seekerIdCtrl,
              decoration: const InputDecoration(
                labelText: '患者 ID',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '提示：患者 ID 可从追踪历史中获取，或让患者在其设置页查看',
              style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              if (seekerIdCtrl.text.isEmpty) return;
              Navigator.pop(ctx);
              _requestTracking(
                seekerIdCtrl.text.trim(),
                nicknameCtrl.text.trim().isEmpty
                    ? '患者'
                    : nicknameCtrl.text.trim(),
              );
            },
            child: const Text('发起'),
          ),
        ],
      ),
    );
  }
}
