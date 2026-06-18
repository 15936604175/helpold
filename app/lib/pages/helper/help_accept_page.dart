import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 接单页 - 查看求助详情并接单
class HelpAcceptPage extends StatefulWidget {
  final String helpId;
  const HelpAcceptPage({super.key, required this.helpId});

  @override
  State<HelpAcceptPage> createState() => _HelpAcceptPageState();
}

class _HelpAcceptPageState extends State<HelpAcceptPage> {
  HelpRequest? _request;
  bool _loading = true;
  bool _accepting = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    final res = await HelpService().getHelpRequest(widget.helpId);
    if (res.success && mounted) {
      setState(() {
        _request =
            HelpRequest.fromJson(res.data['request'] as Map<String, dynamic>);
        _loading = false;
      });
    } else if (mounted) {
      setState(() => _loading = false);
    }
  }

  Future<void> _accept() async {
    final user = appProvider.user;
    if (user == null || _request == null) return;

    final confirmed = await CommonWidgets.showConfirmDialog(
      context,
      title: '确认接单',
      content: '您将前往帮助${_request!.seekerNickname ?? '求助者'}，确认接单吗？',
    );
    if (!confirmed) return;

    setState(() => _accepting = true);
    final res = await HelpService().acceptHelp(
      helpId: widget.helpId,
      helperId: user.id,
      latitude: AppConfig.defaultLatitude,
      longitude: AppConfig.defaultLongitude,
    );
    setState(() => _accepting = false);

    if (!mounted) return;

    if (res.success) {
      CommonWidgets.showSnackBar(context, '接单成功', isSuccess: true);
      Navigator.pushNamedAndRemoveUntil(
        context,
        Routes.helperHome,
        (route) => false,
      );
    } else {
      CommonWidgets.showSnackBar(
          context, res.error ?? '接单失败', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('求助详情')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _request == null
              ? CommonWidgets.emptyState(message: '求助不存在')
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 求助者信息
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              const CircleAvatar(
                                backgroundColor: AppTheme.sosRed,
                                radius: 28,
                                child:
                                    Icon(Icons.person, color: Colors.white),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _request!.seekerNickname ?? '求助者',
                                      style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold),
                                    ),
                                    Text(
                                      formatTime(_request!.createdAt),
                                      style: const TextStyle(
                                          color: AppTheme.textSecondary,
                                          fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
                              if (_request!.distance != null)
                                Chip(
                                  label: Text(
                                      '距离 ${formatDistance(_request!.distance)}'),
                                  backgroundColor: AppTheme.primaryColor
                                      .withOpacity(0.2),
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // 求助信息
                      CommonWidgets.infoCard(
                        icon: Icons.help_outline,
                        title: '求助原因',
                        value: _request!.reason ?? '紧急求助',
                      ),
                      const SizedBox(height: 8),
                      CommonWidgets.infoCard(
                        icon: Icons.accessible,
                        title: '残障类型',
                        value: _request!.disabilityType ?? '无',
                      ),
                      if (_request!.disabilityDetail != null) ...[
                        const SizedBox(height: 8),
                        CommonWidgets.infoCard(
                          icon: Icons.description,
                          title: '残障详情',
                          value: _request!.disabilityDetail!,
                        ),
                      ],
                      const SizedBox(height: 8),
                      CommonWidgets.infoCard(
                        icon: Icons.location_on,
                        title: '位置坐标',
                        value:
                            '${_request!.latitude.toStringAsFixed(4)}, ${_request!.longitude.toStringAsFixed(4)}',
                      ),
                      const SizedBox(height: 8),
                      CommonWidgets.infoCard(
                        icon: Icons.phone,
                        title: '联系电话',
                        value: _request!.sharePhone
                            ? (_request!.seekerPhone ?? '未提供')
                            : '求助者未公开电话',
                        iconColor: _request!.sharePhone
                            ? AppTheme.successColor
                            : AppTheme.textHint,
                      ),
                      const SizedBox(height: 8),
                      // 地图占位
                      Card(
                        child: Container(
                          height: 180,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: AppTheme.primaryLightColor.withOpacity(0.2),
                          ),
                          child: const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.map,
                                    size: 48, color: AppTheme.primaryColor),
                                SizedBox(height: 8),
                                Text('地图视图',
                                    style: TextStyle(
                                        color: AppTheme.textSecondary)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      // 状态判断
                      if (_request!.status == 'pending')
                        ElevatedButton(
                          onPressed: _accepting ? null : _accept,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: _accepting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('接单帮助',
                                  style: TextStyle(fontSize: 16)),
                        )
                      else
                        Card(
                          color: AppTheme.warningColor.withOpacity(0.15),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.info,
                                    color: AppTheme.warningColor),
                                const SizedBox(width: 8),
                                Text(
                                  '此求助已${_request!.statusLabel}，无法接单',
                                  style: TextStyle(
                                      color: AppTheme.warningColor),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}
