import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../network/api_client.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

/// 个人设置页 - 包含模式切换、个人信息编辑、登出
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late TextEditingController _nicknameCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nicknameCtrl =
        TextEditingController(text: appProvider.user?.nickname ?? '');
  }

  @override
  void dispose() {
    _nicknameCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (_nicknameCtrl.text.isEmpty) return;
    setState(() => _saving = true);
    final res = await AuthService()
        .updateProfile({'nickname': _nicknameCtrl.text.trim()});
    setState(() => _saving = false);
    if (res.success && mounted) {
      final user = appProvider.user!;
      appProvider.updateUser(user.copyWith(nickname: _nicknameCtrl.text.trim()));
      CommonWidgets.showSnackBar(context, '保存成功', isSuccess: true);
    } else if (mounted) {
      CommonWidgets.showSnackBar(context, '保存失败', isError: true);
    }
  }

  Future<void> _switchMode(String mode) async {
    await appProvider.switchMode(mode);
    if (!mounted) return;
    if (mode == 'seeker') {
      Navigator.pushNamedAndRemoveUntil(
          context, Routes.sosHome, (route) => false);
    } else {
      Navigator.pushNamedAndRemoveUntil(
          context, Routes.helperHome, (route) => false);
    }
  }

  Future<void> _logout() async {
    final confirmed = await CommonWidgets.showConfirmDialog(
      context,
      title: '退出登录',
      content: '确定要退出登录吗？',
      danger: true,
    );
    if (!confirmed) return;
    ApiClient().clearToken();
    await appProvider.logout();
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(
        context, Routes.login, (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    final user = appProvider.user;
    if (user == null) {
      return const Scaffold(body: Center(child: Text('未登录')));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('设置')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 用户信息卡片
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.primaryColor,
                      radius: 30,
                      child: Text(
                        user.nickname.isNotEmpty
                            ? user.nickname[0]
                            : '?',
                        style: const TextStyle(
                            color: Colors.white, fontSize: 24),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user.nickname,
                              style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold)),
                          Text(user.phone,
                              style: const TextStyle(
                                  color: AppTheme.textSecondary)),
                          const SizedBox(height: 4),
                          Chip(
                            label: Text(_roleLabel(user.role)),
                            backgroundColor:
                                AppTheme.primaryColor.withOpacity(0.2),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 模式切换
            const Text('界面模式',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  RadioListTile<String>(
                    title: const Text('求助者模式'),
                    subtitle:
                        const Text('SOS 求助、追踪确认', style: TextStyle(fontSize: 12)),
                    value: 'seeker',
                    groupValue: appProvider.currentMode,
                    onChanged: (v) => _switchMode(v!),
                  ),
                  const Divider(height: 1),
                  RadioListTile<String>(
                    title: const Text('帮助者/监护模式'),
                    subtitle: const Text('接单帮助、监护追踪',
                        style: TextStyle(fontSize: 12)),
                    value: 'helper',
                    groupValue: appProvider.currentMode,
                    onChanged: (v) => _switchMode(v!),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 个人信息编辑
            const Text('个人信息',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _nicknameCtrl,
              decoration: const InputDecoration(
                labelText: '昵称',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
              ),
            ),
            const SizedBox(height: 8),
            if (user.isSeeker) ...[
              Card(
                child: ListTile(
                  leading: const Icon(Icons.accessible),
                  title: const Text('残障类型'),
                  trailing: Text(user.disabilityType ?? '无'),
                ),
              ),
            ],
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _saving ? null : _saveProfile,
              child: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('保存'),
            ),
            const SizedBox(height: 16),

            // 帮助者专属设置
            if (appProvider.isHelperMode && user.isHelper) ...[
              const Text('帮助者设置',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.schedule),
                  title: const Text('位置计划'),
                  subtitle: const Text('设置各时间段的位置，用于求助距离筛选'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(
                      context, Routes.locationSchedule),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // 求助者专属设置
            if (appProvider.isSeekerMode && user.isDementia) ...[
              const Text('追踪设置',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.location_searching),
                  title: const Text('追踪配置'),
                  subtitle: const Text('持续追踪、上报频率'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(
                      context, Routes.trackingConfig),
                ),
              ),
              const SizedBox(height: 8),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.fence),
                  title: const Text('电子围栏'),
                  subtitle: const Text('安全区域设置'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(
                      context, Routes.geofenceConfig),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // 关于
            const Text('关于',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.info),
                    title: const Text('版本'),
                    trailing: const Text('1.0.0'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.dns),
                    title: const Text('服务器地址'),
                    subtitle: Text(AppConfig.baseUrl),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 登出
            OutlinedButton(
              onPressed: _logout,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.errorColor,
                side: const BorderSide(color: AppTheme.errorColor),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('退出登录'),
            ),
          ],
        ),
      ),
    );
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'seeker':
        return '求助者';
      case 'helper':
        return '帮助者';
      case 'guardian':
        return '紧急联系人';
      default:
        return role;
    }
  }
}
