import 'package:flutter/material.dart';
import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 求助详情页 - 显示求助结果和帮助者信息
class HelpDetailPage extends StatefulWidget {
  final String helpId;
  const HelpDetailPage({super.key, required this.helpId});

  @override
  State<HelpDetailPage> createState() => _HelpDetailPageState();
}

class _HelpDetailPageState extends State<HelpDetailPage> {
  HelpRequest? _request;
  bool _loading = true;

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
                      // 状态卡片
                      Card(
                        color: _request!.status == 'accepted'
                            ? AppTheme.successColor.withOpacity(0.15)
                            : AppTheme.warningColor.withOpacity(0.15),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Icon(
                                _request!.status == 'accepted'
                                    ? Icons.check_circle
                                    : Icons.hourglass_empty,
                                size: 48,
                                color: _request!.status == 'accepted'
                                    ? AppTheme.successColor
                                    : AppTheme.warningColor,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _request!.statusLabel,
                                style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      CommonWidgets.infoCard(
                        icon: Icons.person,
                        title: '求助者',
                        value: _request!.seekerNickname ?? '我',
                      ),
                      const SizedBox(height: 8),
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
                      const SizedBox(height: 8),
                      CommonWidgets.infoCard(
                        icon: Icons.location_on,
                        title: '位置',
                        value:
                            '${_request!.latitude.toStringAsFixed(4)}, ${_request!.longitude.toStringAsFixed(4)}',
                      ),
                      const SizedBox(height: 8),
                      CommonWidgets.infoCard(
                        icon: Icons.access_time,
                        title: '求助时间',
                        value: formatTime(_request!.createdAt),
                      ),
                      if (_request!.status == 'accepted') ...[
                        const SizedBox(height: 8),
                        CommonWidgets.infoCard(
                          icon: Icons.volunteer_activism,
                          title: '帮助者',
                          value: '帮助者已接单，正在赶来',
                          iconColor: AppTheme.successColor,
                        ),
                      ],
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.pushNamedAndRemoveUntil(
                          context,
                          Routes.sosHome,
                          (route) => false,
                        ),
                        child: const Text('返回首页'),
                      ),
                    ],
                  ),
                ),
    );
  }
}
