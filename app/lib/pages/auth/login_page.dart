import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../config/routes.dart';
import '../../config/theme.dart';
import '../../models/user.dart';
import '../../network/api_client.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    final res = await AuthService().login(
      phone: _phoneCtrl.text.trim(),
      password: _passwordCtrl.text,
    );
    setState(() => _loading = false);

    if (!mounted) return;

    if (res.success && res.data['token'] != null) {
      final token = res.data['token'] as String;
      final user = User.fromJson(res.data['user'] as Map<String, dynamic>);
      ApiClient().setToken(token);
      await appProvider.setLogin(token, user);

      // 根据角色跳转
      if (appProvider.isSeekerMode) {
        Navigator.pushReplacementNamed(context, Routes.sosHome);
      } else {
        Navigator.pushReplacementNamed(context, Routes.helperHome);
      }
    } else {
      CommonWidgets.showSnackBar(context, res.error ?? '登录失败', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('登录')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Container(
                width: 80,
                height: 80,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: const BoxDecoration(
                  color: AppTheme.primaryColor,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.health_and_safety,
                  size: 44,
                  color: Colors.white,
                ),
              ),
              const Text(
                '欢迎回来',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                '请登录您的账号',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 32),
              TextFormField(
                controller: _phoneCtrl,
                decoration: const InputDecoration(
                  labelText: '手机号',
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
                validator: (v) {
                  if (v == null || v.isEmpty) return '请输入手机号';
                  if (v.length != 11) return '手机号格式不正确';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordCtrl,
                decoration: InputDecoration(
                  labelText: '密码',
                  prefixIcon: const Icon(Icons.lock),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword
                        ? Icons.visibility_off
                        : Icons.visibility),
                    onPressed: () => setState(
                        () => _obscurePassword = !_obscurePassword),
                  ),
                ),
                obscureText: _obscurePassword,
                validator: (v) {
                  if (v == null || v.isEmpty) return '请输入密码';
                  if (v.length < 6) return '密码至少6位';
                  return null;
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _login,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('登录', style: TextStyle(fontSize: 16)),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('还没有账号？'),
                  TextButton(
                    onPressed: () =>
                        Navigator.pushNamed(context, Routes.register),
                    child: const Text('立即注册'),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Card(
                color: AppTheme.primaryLightColor.withOpacity(0.15),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '测试提示',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '服务器地址：${AppConfig.baseUrl}\n'
                        'Android 模拟器请使用 10.0.2.2，真机请改为实际 IP',
                        style: const TextStyle(
                            fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
