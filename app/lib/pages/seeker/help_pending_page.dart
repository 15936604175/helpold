import 'dart:async';
import 'package:flutter/material.dart';
import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 求助中页 - 显示求助状态，等待帮助者接单
class HelpPendingPage extends StatefulWidget {
  final String? helpId;
  const HelpPendingPage({super.key, this.helpId});

  @override
  State<HelpPendingPage> createState() => _HelpPendingPageState();
}

class _HelpPendingPageState extends State<HelpPendingPage> {
  Timer? _timer;
  HelpRequest? _request;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchRequest();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _fetchRequest());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchRequest() async {
    if (widget.helpId == null) return;
    final res = await HelpService().getHelpRequest(widget.helpId!);
    if (res.success && mounted) {
      setState(() {
        _request = HelpRequest.fromJson(
            res.data['request'] as Map<String, dynamic>);
        _loading = false;
      });

      // 已接单，跳转详情
      if (_request?.status == 'accepted' && mounted) {
        _timer?.cancel();
        Navigator.pushReplacementNamed(
          context,
          Routes.helpDetail,
          arguments: widget.helpId,
        );
      }
    } else if (mounted) {
      setState(() => _loading = false);
    }
  }

  Future<void> _cancel() async {
    if (widget.helpId == null) return;
    final confirmed = await CommonWidgets.showConfirmDialog(
      context,
      title: '取消求助',
      content: '确定要取消本次求助吗？',
      danger: true,
    );
    if (!confirmed) return;

    CommonWidgets.showLoadingDialog(context, message: '取消中...');
    await HelpService().cancelHelp(widget.helpId!);
    CommonWidgets.hideLoadingDialog(context);
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, Routes.sosHome);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('求助中'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () =>
              Navigator.pushReplacementNamed(context, Routes.sosHome),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _request == null
              ? CommonWidgets.emptyState(message: '求助不存在')
              : Column(
                  children: [
                    Expanded(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // 动画指示器
                            TweenAnimationBuilder<double>(
                              tween: Tween(begin: 0.8, end: 1.2),
                              duration: const Duration(seconds: 1),
                              builder: (ctx, value, child) {
                                return Transform.scale(
                                  scale: value,
                                  child: child,
                                );
                              },
                              child: Container(
                                width: 100,
                                height: 100,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppTheme.sosRed.withOpacity(0.2),
                                ),
                                child: const Icon(
                                  Icons.sos,
                                  size: 50,
                                  color: AppTheme.sosRed,
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            const Text(
                              '已通知附近帮助者',
                              style: TextStyle(
                                  fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '求助原因：${_request!.reason ?? '紧急求助'}',
                              style: const TextStyle(
                                  color: AppTheme.textSecondary),
                            ),
                            const SizedBox(height: 32),
                            const CircularProgressIndicator(),
                            const SizedBox(height: 16),
                            const Text(
                              '正在等待帮助者响应...',
                              style: TextStyle(color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _cancel,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.errorColor,
                                side: const BorderSide(
                                    color: AppTheme.errorColor),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                              child: const Text('取消求助'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}
