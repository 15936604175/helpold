import 'dart:async';
import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 求助者模式 - SOS 主页面
///
/// 包含：
/// - 巨大 SOS 按钮（3秒倒计时确认）
/// - 摇一摇触发区域（简化为按钮）
/// - 追踪子模块（老年痴呆患者条件显示）
/// - 通知/追踪请求弹窗
class SosHomePage extends StatefulWidget {
  const SosHomePage({super.key});

  @override
  State<SosHomePage> createState() => _SosHomePageState();
}

class _SosHomePageState extends State<SosHomePage> {
  Timer? _pollTimer;
  List<AppNotification> _notifications = [];

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  /// 轮询通知（模拟推送）
  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _fetchNotifications();
      _fetchPendingTracking();
    });
    // 首次立即拉取
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    final user = appProvider.user;
    if (user == null) return;
    final res = await LocationService().getNotifications(user.id);
    if (res.success && mounted) {
      setState(() {
        _notifications = (res.data['notifications'] as List)
            .map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
            .toList();
      });
    }
  }

  Future<void> _fetchPendingTracking() async {
    final user = appProvider.user;
    if (user == null) return;
    // 老年痴呆患者才需要检查追踪请求
    if (!user.isDementia) return;
    final res = await TrackingService().getPendingTracking(user.id);
    if (res.success && mounted) {
      final pending = (res.data['pending'] as List)
          .map((t) => LocationTracking.fromJson(t as Map<String, dynamic>))
          .toList();
      if (pending.isNotEmpty) {
        _showTrackingRequestDialog(pending.first);
      }
    }
  }

  void _showTrackingRequestDialog(LocationTracking tracking) async {
    if (!mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('家属请求查看您的位置'),
        content: Text(
          '家属${tracking.guardianNickname ?? ''}正在请求查看您的位置，是否允许？',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('拒绝'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('同意'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // 同意：上报当前位置并确认追踪
      final res = await LocationService().updateLocation(
        latitude: AppConfig.defaultLatitude,
        longitude: AppConfig.defaultLongitude,
        source: 'manual',
      );
      if (res.success) {
        await TrackingService().confirmTracking(
          trackingId: tracking.id,
          latitude: AppConfig.defaultLatitude,
          longitude: AppConfig.defaultLongitude,
        );
        if (mounted) {
          CommonWidgets.showSnackBar(context, '已分享位置给家属',
              isSuccess: true);
        }
      }
    } else {
      await TrackingService().denyTracking(tracking.id);
    }
  }

  /// 触发 SOS 求助
  Future<void> _triggerSos() async {
    final user = appProvider.user;
    if (user == null) return;

    // 3秒倒计时确认
    final confirmed = await _showSosConfirmDialog();
    if (!confirmed || !mounted) return;

    // 选择求助原因
    final reason = await _showReasonPicker();
    if (reason == null || !mounted) return;

    CommonWidgets.showLoadingDialog(context, message: '正在发送求助...');
    final res = await HelpService().createHelpRequest(
      seekerId: user.id,
      latitude: AppConfig.defaultLatitude,
      longitude: AppConfig.defaultLongitude,
      address: '当前位置',
      reason: reason,
      disabilityType: user.disabilityType,
      disabilityDetail: user.disabilityDetail,
      sharePhone: user.sharePhone,
      seekerPhone: user.sharePhone ? user.phone : null,
    );
    CommonWidgets.hideLoadingDialog(context);

    if (!mounted) return;

    if (res.success && res.data['help_id'] != null) {
      final helpId = res.data['help_id'] as String;
      final count = res.data['candidates_count'] ?? 0;
      CommonWidgets.showSnackBar(
        context,
        '求助已发送，已通知 $count 位附近帮助者',
        isSuccess: true,
      );
      Navigator.pushNamed(context, Routes.helpPending, arguments: helpId);
    } else {
      CommonWidgets.showSnackBar(
          context, res.error ?? '求助失败', isError: true);
    }
  }

  Future<bool> _showSosConfirmDialog() async {
    int countdown = 3;
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) {
          Future.delayed(const Duration(seconds: 1), () {
            if (countdown > 1 && ctx.mounted) {
              setState(() => countdown--);
            } else if (ctx.mounted) {
              Navigator.pop(ctx, true);
            }
          });
          return AlertDialog(
            title: const Text('确认发起求助？'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.warning, color: AppTheme.sosRed, size: 48),
                const SizedBox(height: 16),
                Text('将在 $countdown 秒后自动确认'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('取消'),
              ),
            ],
          );
        },
      ),
    );
    return result ?? false;
  }

  Future<String?> _showReasonPicker() async {
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('选择求助原因'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: AppConfig.helpReasons.length,
            itemBuilder: (ctx, index) {
              return ListTile(
                leading: const Icon(Icons.arrow_right),
                title: Text(AppConfig.helpReasons[index]),
                onTap: () => Navigator.pop(ctx, AppConfig.helpReasons[index]),
              );
            },
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: ListenableBuilder(
          listenable: appProvider,
          builder: (ctx, _) => Text(appProvider.user?.nickname ?? '互助SOS'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () => _showNotificationsPanel(),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () =>
                Navigator.pushNamed(context, Routes.settings),
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: appProvider,
        builder: (ctx, _) {
          final user = appProvider.user;
          if (user == null) {
            return const Center(child: Text('请先登录'));
          }
          return Column(
            children: [
              // 追踪子模块状态栏（老年痴呆患者显示）
              if (user.isDementia) _buildTrackingStatusBar(user),
              // SOS 主区域
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // SOS 按钮
                      GestureDetector(
                        onTap: _triggerSos,
                        child: Container(
                          width: 220,
                          height: 220,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.sosRed,
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.sosRed.withOpacity(0.4),
                                blurRadius: 30,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.sos, size: 80, color: Colors.white),
                              SizedBox(height: 8),
                              Text(
                                'SOS',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 4,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                '点击求助',
                                style: TextStyle(color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      // 用户信息
                      CommonWidgets.infoCard(
                        icon: Icons.accessible,
                        title: '残障类型',
                        value: user.disabilityType ?? '无',
                      ),
                      if (user.disabilityDetail != null) ...[
                        const SizedBox(height: 8),
                        CommonWidgets.infoCard(
                          icon: Icons.description,
                          title: '详情',
                          value: user.disabilityDetail!,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  /// 追踪状态栏（老年痴呆患者条件显示）
  Widget _buildTrackingStatusBar(user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: user.continuousTracking
          ? AppTheme.successColor.withOpacity(0.15)
          : AppTheme.warningColor.withOpacity(0.15),
      child: Row(
        children: [
          Icon(
            user.continuousTracking ? Icons.location_on : Icons.location_off,
            color: user.continuousTracking
                ? AppTheme.successColor
                : AppTheme.warningColor,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              user.continuousTracking ? '后台追踪运行中' : '追踪已暂停',
              style: TextStyle(
                color: user.continuousTracking
                    ? AppTheme.successColor
                    : AppTheme.warningColor,
                fontSize: 13,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pushNamed(context, Routes.trackingConfig),
            child: const Text('设置'),
          ),
        ],
      ),
    );
  }

  void _showNotificationsPanel() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('通知',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                if (_notifications.isNotEmpty)
                  TextButton(
                    onPressed: () async {
                      await LocationService()
                          .clearNotifications(appProvider.user!.id);
                      Navigator.pop(ctx);
                      _fetchNotifications();
                    },
                    child: const Text('清空'),
                  ),
              ],
            ),
            const Divider(),
            Expanded(
              child: _notifications.isEmpty
                  ? CommonWidgets.emptyState(message: '暂无通知')
                  : ListView.builder(
                      itemCount: _notifications.length,
                      itemBuilder: (ctx, index) {
                        final n = _notifications[index];
                        return ListTile(
                          leading: Icon(
                            _getNotificationIcon(n.type),
                            color: AppTheme.primaryColor,
                          ),
                          title: Text(n.title ?? n.typeLabel),
                          subtitle: Text(n.body ?? ''),
                          trailing: Text(
                            formatTime(n.createdAt),
                            style: const TextStyle(
                                fontSize: 12, color: AppTheme.textSecondary),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'accepted':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel;
      case 'track_request':
        return Icons.location_searching;
      default:
        return Icons.notifications;
    }
  }
}
