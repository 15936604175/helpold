/// 应用全局配置
class AppConfig {
  /// 后端 API 基础地址
  /// Android 模拟器访问本机服务需使用 10.0.2.2，真机请改为实际 IP
  static const String baseUrl = 'http://10.0.2.2:3000';

  /// 模拟器/真机切换提示
  static const String androidEmulatorHost = '10.0.2.2';
  static const String physicalDeviceHost = '127.0.0.1';

  /// 默认坐标（北京天安门，用于未授权定位时的占位）
  static const double defaultLatitude = 39.9042;
  static const double defaultLongitude = 116.4074;

  /// 求助原因快捷选项
  static const List<String> helpReasons = [
    '摔倒无法起身',
    '突发疾病',
    '迷路',
    '遇到危险',
    '其他',
  ];

  /// 残障类型选项
  static const List<String> disabilityTypes = [
    '盲人',
    '聋哑',
    '肢体残障',
    '老年痴呆',
    '其他',
    '无',
  ];

  /// 帮助者在线状态选项
  static const List<String> helperStatuses = ['online', 'offline', 'busy'];
  static const Map<String, String> helperStatusLabels = {
    'online': '在线',
    'offline': '离线',
    'busy': '忙碌',
  };
}
