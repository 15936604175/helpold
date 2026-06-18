import 'package:flutter/material.dart';
import '../config/routes.dart';
import '../config/theme.dart';

/// 权限引导页
///
/// 由于无法使用 permission_handler 包，此页面仅做权限说明和引导。
/// 实际权限申请在首次使用定位/通知功能时由系统自动触发。
class PermissionGuidePage extends StatefulWidget {
  const PermissionGuidePage({super.key});

  @override
  State<PermissionGuidePage> createState() => _PermissionGuidePageState();
}

class _PermissionGuidePageState extends State<PermissionGuidePage> {
  int _currentStep = 0;

  final List<_PermissionItem> _items = [
    _PermissionItem(
      icon: Icons.location_on,
      title: '位置权限',
      desc: '用于获取您的 GPS 位置，发起求助时通知附近帮助者',
      required: true,
    ),
    _PermissionItem(
      icon: Icons.notifications,
      title: '通知权限',
      desc: '接收求助请求、追踪请求和接单通知',
      required: true,
    ),
    _PermissionItem(
      icon: Icons.location_searching,
      title: '后台定位',
      desc: '老年痴呆患者持续追踪需要后台定位权限',
      required: false,
    ),
    _PermissionItem(
      icon: Icons.mic,
      title: '麦克风权限',
      desc: '语音唤醒和语音识别功能需要麦克风权限',
      required: false,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('权限引导'),
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _items.length,
              itemBuilder: (context, index) {
                final item = _items[index];
                final isCurrent = index == _currentStep;
                return Card(
                  color: isCurrent ? AppTheme.primaryLightColor.withOpacity(0.2) : null,
                  child: ListTile(
                    leading: Icon(item.icon,
                        color: isCurrent ? AppTheme.primaryColor : AppTheme.textSecondary,
                        size: 32),
                    title: Text(
                      item.title,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(item.desc),
                    trailing: item.required
                        ? const Chip(
                            label: Text('必需'),
                            backgroundColor: AppTheme.errorColor,
                            labelStyle: TextStyle(color: Colors.white, fontSize: 12),
                          )
                        : const Chip(
                            label: Text('可选'),
                            backgroundColor: AppTheme.textHint,
                            labelStyle: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  '步骤 ${_currentStep + 1} / ${_items.length}：${_items[_currentStep].title}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (_currentStep > 0)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setState(() => _currentStep--),
                          child: const Text('上一步'),
                        ),
                      ),
                    if (_currentStep > 0) const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _nextStep,
                        child: Text(
                          _currentStep == _items.length - 1 ? '完成' : '下一步',
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _nextStep() {
    if (_currentStep < _items.length - 1) {
      setState(() => _currentStep++);
    } else {
      // 完成，进入主页（由调用方决定）
      Navigator.pushReplacementNamed(context, Routes.sosHome);
    }
  }
}

class _PermissionItem {
  final IconData icon;
  final String title;
  final String desc;
  final bool required;

  const _PermissionItem({
    required this.icon,
    required this.title,
    required this.desc,
    required this.required,
  });
}
