import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../config/routes.dart';
import '../../models/user.dart';
import '../../network/api_client.dart';
import '../../providers/app_provider.dart';
import '../../services/api_services.dart';
import '../../widgets/common_widgets.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nicknameCtrl = TextEditingController();
  final _emergencyNameCtrl = TextEditingController();
  final _emergencyPhoneCtrl = TextEditingController();

  String _role = 'seeker';
  String _disabilityType = '无';
  bool _loading = false;
  bool _autoConsent = false;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _nicknameCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    final res = await AuthService().register(
      phone: _phoneCtrl.text.trim(),
      password: _passwordCtrl.text,
      nickname: _nicknameCtrl.text.trim(),
      role: _role,
      disabilityType: _role == 'seeker' ? _disabilityType : null,
      emergencyContactName:
          _role == 'seeker' ? _emergencyNameCtrl.text.trim() : null,
      emergencyContactPhone:
          _role == 'seeker' ? _emergencyPhoneCtrl.text.trim() : null,
      autoConsent: _autoConsent,
    );
    setState(() => _loading = false);

    if (!mounted) return;

    if (res.success && res.data['token'] != null) {
      final token = res.data['token'] as String;
      final user = User.fromJson(res.data['user'] as Map<String, dynamic>);
      ApiClient().setToken(token);
      await appProvider.setLogin(token, user);

      CommonWidgets.showSnackBar(context, '注册成功');
      await Future.delayed(const Duration(milliseconds: 500));
      if (!mounted) return;

      if (appProvider.isSeekerMode) {
        Navigator.pushReplacementNamed(context, Routes.sosHome);
      } else {
        Navigator.pushReplacementNamed(context, Routes.helperHome);
      }
    } else {
      CommonWidgets.showSnackBar(context, res.error ?? '注册失败', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('注册')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 角色选择
              const Text('选择您的角色', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: RadioListTile<String>(
                      title: const Text('求助者'),
                      subtitle: const Text('需要帮助', style: TextStyle(fontSize: 12)),
                      value: 'seeker',
                      groupValue: _role,
                      onChanged: (v) => setState(() => _role = v!),
                    ),
                  ),
                  Expanded(
                    child: RadioListTile<String>(
                      title: const Text('帮助者'),
                      subtitle: const Text('提供帮助', style: TextStyle(fontSize: 12)),
                      value: 'helper',
                      groupValue: _role,
                      onChanged: (v) => setState(() => _role = v!),
                    ),
                  ),
                ],
              ),
              Expanded(
                child: RadioListTile<String>(
                  title: const Text('紧急联系人'),
                  subtitle: const Text('监护患者', style: TextStyle(fontSize: 12)),
                  value: 'guardian',
                  groupValue: _role,
                  onChanged: (v) => setState(() => _role = v!),
                ),
              ),
              const Divider(height: 32),

              // 基本信息
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
                controller: _nicknameCtrl,
                decoration: const InputDecoration(
                  labelText: '昵称',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    (v == null || v.isEmpty) ? '请输入昵称' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordCtrl,
                decoration: const InputDecoration(
                  labelText: '密码',
                  prefixIcon: Icon(Icons.lock),
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                validator: (v) {
                  if (v == null || v.isEmpty) return '请输入密码';
                  if (v.length < 6) return '密码至少6位';
                  return null;
                },
              ),

              // 求助者额外信息
              if (_role == 'seeker') ...[
                const SizedBox(height: 24),
                const Text('残障信息',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _disabilityType,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.accessible),
                  ),
                  items: AppConfig.disabilityTypes
                      .map((t) => DropdownMenuItem(
                            value: t,
                            child: Text(t),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _disabilityType = v!),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emergencyNameCtrl,
                  decoration: const InputDecoration(
                    labelText: '紧急联系人姓名',
                    prefixIcon: Icon(Icons.contact_emergency),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? '请输入紧急联系人姓名' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emergencyPhoneCtrl,
                  decoration: const InputDecoration(
                    labelText: '紧急联系人电话',
                    prefixIcon: Icon(Icons.phone_in_talk),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.phone,
                  validator: (v) {
                    if (v == null || v.isEmpty) return '请输入紧急联系人电话';
                    if (v.length != 11) return '手机号格式不正确';
                    return null;
                  },
                ),
                if (_disabilityType == '老年痴呆') ...[
                  const SizedBox(height: 8),
                  SwitchListTile(
                    title: const Text('自动同意追踪'),
                    subtitle: const Text(
                      '重度失智患者无需每次确认，家属可直接获取位置',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: _autoConsent,
                    onChanged: (v) => setState(() => _autoConsent = v),
                  ),
                ],
              ],

              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _loading ? null : _register,
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
                    : const Text('注册', style: TextStyle(fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
