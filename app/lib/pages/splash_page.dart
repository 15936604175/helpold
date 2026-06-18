import 'package:flutter/material.dart';
import '../config/routes.dart';
import '../config/theme.dart';
import '../models/user.dart';
import '../network/api_client.dart';
import '../providers/app_provider.dart';
import '../services/api_services.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  String _statusText = '正在初始化...';

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await appProvider.init();

    await Future.delayed(const Duration(milliseconds: 1500));

    if (!mounted) return;

    if (appProvider.isLoggedIn) {
      ApiClient().setToken(appProvider.token);
      _setStatus('正在验证登录...');
      final res = await AuthService().getProfile();
      if (res.success && res.data['user'] != null) {
        appProvider.updateUser(
          User.fromJson(res.data['user'] as Map<String, dynamic>),
        );
      }
      if (!mounted) return;
      _navigateByMode();
    } else {
      Navigator.pushReplacementNamed(context, Routes.login);
    }
  }

  void _navigateByMode() {
    if (appProvider.isSeekerMode) {
      Navigator.pushReplacementNamed(context, Routes.sosHome);
    } else {
      Navigator.pushReplacementNamed(context, Routes.helperHome);
    }
  }

  void _setStatus(String text) {
    if (mounted) setState(() => _statusText = text);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.health_and_safety,
                size: 64,
                color: AppTheme.sosRed,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              '互助SOS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '紧急求助平台',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                color: Colors.white.withOpacity(0.8),
                strokeWidth: 2,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _statusText,
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}
