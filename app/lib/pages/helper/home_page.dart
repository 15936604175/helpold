import 'dart:async';
import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 帮助者/监护模式 - 首页
///
/// 顶部 Tab 切换：
/// - 帮助：地图占位 + 在线状态切换 + 附近求助入口
/// - 监护：患者列表（条件显示，需有监护关系）
class HelperHomePage extends StatefulWidget {
  const HelperHomePage({super.key});

  @override
  State<HelperHomePage> createState() => _HelperHomePageState();
}

class _HelperHomePageState extends State<HelperHomePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _helperStatus = 'offline';
  CurrentLocation? _currentLocation;
  Timer? _pollTimer;
  List<AppNotification> _notifications = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchStatus();
    _fetchRelations();
    _startPolling();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _fetchNotifications();
    });
    _fetchNotifications();
  }

  Future<void> _fetchStatus() async {
    // 默认 offline，从服务端拉取当前状态
    final res = await ScheduleService().recomputeLocation();
    if (res.success && mounted) {
      setState(() {
        _currentLocation = res.data['current_location'] != null
            ? CurrentLocation.fromJson(
                res.data['current_location'] as Map<String, dynamic>)
            : null;
      });
    }
  }

  Future<void> _fetchRelations() async {
    // 拉取监护关系（通过追踪历史间接判断）
    final res = await TrackingService().getTrackingHistory();
    if (res.success && mounted) {
      final history = res.data['history'] as List? ?? [];
      // 简化：有历史记录则显示监护 Tab
      if (history.isEmpty) {
        setState(() {});
      }
    }
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

  Future<void> _updateStatus(String status) async {
    setState(() => _helperStatus = status);
    final res = await LocationService().updateHelperStatus(status);
    if (res.success && mounted) {
      // 切换为 online 时自动返回当前匹配位置
      setState(() {
        _currentLocation = res.data['current_location'] != null
            ? CurrentLocation.fromJson(
                res.data['current_location'] as Map<String, dynamic>)
            : null;
      });
      if (status == 'online' && _currentLocation == null) {
        CommonWidgets.showSnackBar(
          context,
          '已上线，但当前时间无匹配的位置计划，请前往"位置计划"设置',
          isError: true,
        );
      } else if (status == 'online') {
        CommonWidgets.showSnackBar(
          context,
          '已上线，当前位置：${_currentLocation!.address}',
          isSuccess: true,
        );
      }
    } else if (mounted) {
      CommonWidgets.showSnackBar(context, '状态更新失败', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: ListenableBuilder(
          listenable: appProvider,
          builder: (_, __) => Text(appProvider.user?.nickname ?? '帮助者'),
        ),
        actions: [
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.notifications),
                if (_notifications.isNotEmpty)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: AppTheme.errorColor,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        '${_notifications.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: _showNotifications,
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.pushNamed(context, Routes.settings),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.handshake), text: '帮助'),
            Tab(icon: Icon(Icons.family_restroom), text: '监护'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildHelperTab(),
          _buildGuardianTab(),
        ],
      ),
    );
  }

  /// 帮助者 Tab
  Widget _buildHelperTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 在线状态切换
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('我的状态',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Row(
                    children: AppConfig.helperStatuses.map((status) {
                      final selected = _helperStatus == status;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(
                                AppConfig.helperStatusLabels[status]!),
                            selected: selected,
                            onSelected: (_) => _updateStatus(status),
                            selectedColor: AppTheme.primaryColor,
                            labelStyle: TextStyle(
                              color: selected ? Colors.white : null,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 当前匹配位置卡片
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _currentLocation != null
                            ? Icons.my_location
                            : Icons.location_off,
                        color: _currentLocation != null
                            ? AppTheme.successColor
                            : AppTheme.textSecondary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _currentLocation != null ? '当前位置（已匹配）' : '当前位置（无匹配）',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const Divider(),
                  if (_currentLocation != null) ...[
                    Text('计划：${_currentLocation!.planName ?? '-'}',
                        style: const TextStyle(fontSize: 13)),
                    const SizedBox(height: 4),
                    Text('地址：${_currentLocation!.address ?? '-'}',
                        style: const TextStyle(fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(
                      '时间段：${_currentLocation!.startTime ?? '-'} - ${_currentLocation!.endTime ?? '-'}',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ] else
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        '当前时间无匹配的位置计划，您不会出现在求助筛选中。\n请前往"位置计划"添加。',
                        style: TextStyle(
                            color: AppTheme.textSecondary, fontSize: 13),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 地图占位
          Card(
            child: Container(
              height: 200,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: AppTheme.primaryLightColor.withOpacity(0.2),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.map, size: 64, color: AppTheme.primaryColor),
                    SizedBox(height: 8),
                    Text('地图视图（需集成地图插件）',
                        style: TextStyle(color: AppTheme.textSecondary)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 快捷操作
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () =>
                      Navigator.pushNamed(context, Routes.helpList),
                  icon: const Icon(Icons.list),
                  label: const Text('附近求助'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await Navigator.pushNamed(
                        context, Routes.locationSchedule);
                    // 返回时刷新当前位置
                    _fetchStatus();
                  },
                  icon: const Icon(Icons.schedule),
                  label: const Text('位置计划'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 监护 Tab
  Widget _buildGuardianTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('监护面板',
                  style:
                      TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(
                icon: const Icon(Icons.person_add),
                onPressed: _showBindDialog,
                tooltip: '绑定患者',
              ),
            ],
          ),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              leading:
                  const Icon(Icons.family_restroom, color: AppTheme.primaryColor),
              title: const Text('患者列表与追踪'),
              subtitle: const Text('查看已绑定患者，发起位置追踪'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () =>
                  Navigator.pushNamed(context, Routes.guardianPanel),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: const Icon(Icons.history, color: AppTheme.primaryColor),
              title: const Text('追踪历史'),
              subtitle: const Text('查看历史追踪记录'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () =>
                  Navigator.pushNamed(context, Routes.guardianPanel),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: const Icon(Icons.fence, color: AppTheme.primaryColor),
              title: const Text('电子围栏配置'),
              subtitle: const Text('设置患者安全区域'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () =>
                  Navigator.pushNamed(context, Routes.geofenceConfig),
            ),
          ),
        ],
      ),
    );
  }

  void _showBindDialog() {
    final phoneCtrl = TextEditingController();
    final relationCtrl = TextEditingController(text: '子女');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('绑定患者'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: phoneCtrl,
              decoration: const InputDecoration(
                labelText: '患者手机号',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: relationCtrl,
              decoration: const InputDecoration(
                labelText: '关系',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (phoneCtrl.text.isEmpty) return;
              Navigator.pop(ctx);
              final res = await LocationService().bindGuardian(
                seekerPhone: phoneCtrl.text.trim(),
                relation: relationCtrl.text.trim(),
              );
              if (res.success && mounted) {
                CommonWidgets.showSnackBar(context, '绑定成功：${res.data['seeker_nickname']}',
                    isSuccess: true);
              } else if (mounted) {
                CommonWidgets.showSnackBar(
                    context, res.error ?? '绑定失败', isError: true);
              }
            },
            child: const Text('绑定'),
          ),
        ],
      ),
    );
  }

  void _showNotifications() {
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
                          leading: Icon(_getNotificationIcon(n.type),
                              color: AppTheme.primaryColor),
                          title: Text(n.title ?? n.typeLabel),
                          subtitle: Text(n.body ?? ''),
                          trailing: Text(
                            formatTime(n.createdAt),
                            style: const TextStyle(
                                fontSize: 12, color: AppTheme.textSecondary),
                          ),
                          onTap: () {
                            // 如果是求助通知，跳转接单页
                            if (n.type == 'help_request') {
                              Navigator.pop(ctx);
                              Navigator.pushNamed(context, Routes.helpList);
                            }
                          },
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
      case 'help_request':
        return Icons.sos;
      case 'accepted':
        return Icons.check_circle;
      default:
        return Icons.notifications;
    }
  }
}
