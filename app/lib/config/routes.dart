import 'package:flutter/material.dart';
import '../pages/splash_page.dart';
import '../pages/auth/login_page.dart';
import '../pages/auth/register_page.dart';
import '../pages/permission_guide_page.dart';
import '../pages/seeker/sos_home_page.dart';
import '../pages/seeker/help_pending_page.dart';
import '../pages/seeker/help_detail_page.dart';
import '../pages/helper/home_page.dart';
import '../pages/helper/help_list_page.dart';
import '../pages/helper/help_accept_page.dart';
import '../pages/helper/guardian_panel_page.dart';
import '../pages/helper/location_schedule_page.dart';
import '../pages/settings/settings_page.dart';
import '../pages/settings/tracking_config_page.dart';
import '../pages/settings/geofence_config_page.dart';

/// 路由名称常量
class Routes {
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String permissionGuide = '/permission';
  static const String sosHome = '/sos-home';
  static const String helpPending = '/help-pending';
  static const String helpDetail = '/help-detail';
  static const String helperHome = '/helper-home';
  static const String helpList = '/help-list';
  static const String helpAccept = '/help-accept';
  static const String guardianPanel = '/guardian';
  static const String locationSchedule = '/location-schedule';
  static const String settings = '/settings';
  static const String trackingConfig = '/tracking-config';
  static const String geofenceConfig = '/geofence-config';
}

/// 路由生成器
Route<dynamic> onGenerateRoute(RouteSettings settings) {
  final name = settings.name;
  final args = settings.arguments;

  switch (name) {
    case Routes.splash:
      return _build(const SplashPage());
    case Routes.login:
      return _build(const LoginPage());
    case Routes.register:
      return _build(const RegisterPage());
    case Routes.permissionGuide:
      return _build(const PermissionGuidePage());
    case Routes.sosHome:
      return _build(const SosHomePage());
    case Routes.helpPending:
      final helpId = args as String?;
      return _build(HelpPendingPage(helpId: helpId));
    case Routes.helpDetail:
      final helpId = args as String;
      return _build(HelpDetailPage(helpId: helpId));
    case Routes.helperHome:
      return _build(const HelperHomePage());
    case Routes.helpList:
      return _build(const HelpListPage());
    case Routes.helpAccept:
      final helpId = args as String;
      return _build(HelpAcceptPage(helpId: helpId));
    case Routes.guardianPanel:
      return _build(const GuardianPanelPage());
    case Routes.locationSchedule:
      return _build(const LocationSchedulePage());
    case Routes.settings:
      return _build(const SettingsPage());
    case Routes.trackingConfig:
      return _build(const TrackingConfigPage());
    case Routes.geofenceConfig:
      return _build(const GeofenceConfigPage());
    default:
      return _build(_NotFoundPage(name: name));
  }
}

PageRoute _build(Widget page) {
  return MaterialPageRoute(builder: (_) => page);
}

class _NotFoundPage extends StatelessWidget {
  final String? name;
  const _NotFoundPage({this.name});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('页面不存在')),
      body: Center(child: Text('路由 $name 未找到')),
    );
  }
}
