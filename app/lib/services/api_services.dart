import '../network/api_client.dart';

/// 认证相关 API
class AuthService {
  final ApiClient _client = ApiClient();

  /// 注册
  Future<ApiResponse> register({
    required String phone,
    required String password,
    required String nickname,
    required String role,
    String? disabilityType,
    String? disabilityDetail,
    String? emergencyContactName,
    String? emergencyContactPhone,
    bool? locationAuth,
    bool? autoConsent,
  }) {
    return _client.post('/api/auth/register', body: {
      'phone': phone,
      'password': password,
      'nickname': nickname,
      'role': role,
      'disability_type': disabilityType,
      'disability_detail': disabilityDetail,
      'emergency_contact_name': emergencyContactName,
      'emergency_contact_phone': emergencyContactPhone,
      'location_auth': locationAuth ?? true,
      'auto_consent': autoConsent ?? false,
    });
  }

  /// 登录
  Future<ApiResponse> login({
    required String phone,
    required String password,
  }) {
    return _client.post('/api/auth/login', body: {
      'phone': phone,
      'password': password,
    });
  }

  /// 获取个人信息
  Future<ApiResponse> getProfile() {
    return _client.get('/api/user/profile');
  }

  /// 更新个人信息
  Future<ApiResponse> updateProfile(Map<String, dynamic> data) {
    return _client.put('/api/user/profile', body: data);
  }
}

/// 位置相关 API
class LocationService {
  final ApiClient _client = ApiClient();

  /// 上报位置（求助者使用 GPS 上报，帮助者由系统自动计算无需调用）
  Future<ApiResponse> updateLocation({
    required double latitude,
    required double longitude,
    String? address,
    String? source, // gps / schedule / manual
    double? accuracy,
  }) {
    return _client.post('/api/user/location', body: {
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'source': source,
      'accuracy': accuracy,
    });
  }

  /// 更新帮助者在线状态（切换为 online 时自动按位置计划计算位置）
  Future<ApiResponse> updateHelperStatus(String status) {
    return _client.put('/api/helper/status', body: {'status': status});
  }

  /// 绑定患者（监护人）
  Future<ApiResponse> bindGuardian({
    required String seekerPhone,
    String relation = '子女',
  }) {
    return _client.post('/api/guardian/bind', body: {
      'seeker_phone': seekerPhone,
      'relation': relation,
    });
  }

  /// 获取通知
  Future<ApiResponse> getNotifications(String userId) {
    return _client.get('/api/notifications/$userId');
  }

  /// 清除通知
  Future<ApiResponse> clearNotifications(String userId) {
    return _client.post('/api/notifications/clear/$userId');
  }
}

/// 帮助者固定位置计划 API
class ScheduleService {
  final ApiClient _client = ApiClient();

  /// 获取我的所有位置计划
  Future<ApiResponse> getSchedules() {
    return _client.get('/api/helper/location-schedules');
  }

  /// 新增位置计划条目
  /// [daysOfWeek] 适用星期数组，0=周日, 1-6=周一至周六
  Future<ApiResponse> addSchedule({
    required String name,
    required List<int> daysOfWeek,
    required String startTime,
    required String endTime,
    required double latitude,
    required double longitude,
    required String address,
    String? addressDetail,
  }) {
    return _client.post('/api/helper/location-schedules', body: {
      'name': name,
      'days_of_week': daysOfWeek,
      'start_time': startTime,
      'end_time': endTime,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'address_detail': addressDetail,
    });
  }

  /// 更新位置计划条目
  Future<ApiResponse> updateSchedule({
    required String id,
    String? name,
    int? dayOfWeek,
    String? startTime,
    String? endTime,
    double? latitude,
    double? longitude,
    String? address,
    String? addressDetail,
    bool? enabled,
  }) {
    return _client.put('/api/helper/location-schedules/$id', body: {
      'name': name,
      'day_of_week': dayOfWeek,
      'start_time': startTime,
      'end_time': endTime,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'address_detail': addressDetail,
      'enabled': enabled,
    });
  }

  /// 删除位置计划条目
  Future<ApiResponse> deleteSchedule(String id) {
    return _client.delete('/api/helper/location-schedules/$id');
  }

  /// 手动触发重新计算当前位置
  Future<ApiResponse> recomputeLocation() {
    return _client.post('/api/helper/location-schedules/recompute');
  }
}

/// 求助相关 API
class HelpService {
  final ApiClient _client = ApiClient();

  /// 创建求助请求
  Future<ApiResponse> createHelpRequest({
    required String seekerId,
    required double latitude,
    required double longitude,
    String? address,
    String? reason,
    String? disabilityType,
    String? disabilityDetail,
    bool sharePhone = false,
    String? seekerPhone,
  }) {
    return _client.post('/api/help/request', body: {
      'seeker_id': seekerId,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'reason': reason,
      'disability_type': disabilityType,
      'disability_detail': disabilityDetail,
      'share_phone': sharePhone,
      'seeker_phone': seekerPhone,
    });
  }

  /// 获取求助详情
  Future<ApiResponse> getHelpRequest(String id) {
    return _client.get('/api/help/request/$id');
  }

  /// 取消求助
  Future<ApiResponse> cancelHelp(String id) {
    return _client.post('/api/help/request/$id/cancel');
  }

  /// 接单
  Future<ApiResponse> acceptHelp({
    required String helpId,
    required String helperId,
    double? latitude,
    double? longitude,
  }) {
    return _client.post('/api/help/request/$helpId/accept', body: {
      'helper_id': helperId,
      'latitude': latitude,
      'longitude': longitude,
    });
  }

  /// 获取附近求助
  Future<ApiResponse> getNearbyHelp({double? lat, double? lon}) {
    final query = <String, String>{};
    if (lat != null) query['lat'] = lat.toString();
    if (lon != null) query['lon'] = lon.toString();
    return _client.get('/api/help/nearby', query: query);
  }
}

/// 追踪相关 API
class TrackingService {
  final ApiClient _client = ApiClient();

  /// 请求追踪患者位置
  Future<ApiResponse> requestTracking({
    required String seekerId,
    String? guardianId,
  }) {
    return _client.post('/api/track/request/$seekerId', body: {
      'guardian_id': guardianId,
    });
  }

  /// 确认追踪
  Future<ApiResponse> confirmTracking({
    required String trackingId,
    required double latitude,
    required double longitude,
    String? address,
  }) {
    return _client.post('/api/track/confirm/$trackingId', body: {
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
    });
  }

  /// 拒绝追踪
  Future<ApiResponse> denyTracking(String trackingId) {
    return _client.post('/api/track/deny/$trackingId');
  }

  /// 获取实时位置
  Future<ApiResponse> getRealtimeLocation(String seekerId) {
    return _client.get('/api/track/realtime/$seekerId');
  }

  /// 更新追踪配置
  Future<ApiResponse> updateTrackingConfig({
    required String userId,
    bool? continuousTracking,
    int? trackingInterval,
    int? geofenceRadius,
    bool? nightModeEnabled,
  }) {
    return _client.put('/api/track/config', body: {
      'user_id': userId,
      'continuous_tracking': continuousTracking,
      'tracking_interval': trackingInterval,
      'geofence_radius': geofenceRadius,
      'night_mode_enabled': nightModeEnabled,
    });
  }

  /// 开启持续追踪
  Future<ApiResponse> startTracking({
    required String userId,
    int? trackingInterval,
  }) {
    return _client.post('/api/track/start', body: {
      'user_id': userId,
      'tracking_interval': trackingInterval,
    });
  }

  /// 停止持续追踪
  Future<ApiResponse> stopTracking(String userId) {
    return _client.post('/api/track/stop', body: {'user_id': userId});
  }

  /// 获取待确认的追踪请求（患者端）
  Future<ApiResponse> getPendingTracking(String userId) {
    return _client.get('/api/track/my-pending', query: {'userId': userId});
  }

  /// 获取追踪历史（监护人端）
  Future<ApiResponse> getTrackingHistory() {
    return _client.get('/api/track/history');
  }
}

/// 电子围栏 API
class GeofenceService {
  final ApiClient _client = ApiClient();

  /// 获取围栏配置
  Future<ApiResponse> getGeofence(String userId) {
    return _client.get('/api/geofence/$userId');
  }

  /// 更新围栏
  Future<ApiResponse> updateGeofence({
    required String userId,
    required double latitude,
    required double longitude,
    int radius = 500,
  }) {
    return _client.put('/api/geofence/$userId', body: {
      'latitude': latitude,
      'longitude': longitude,
      'radius': radius,
    });
  }

  /// 启用围栏
  Future<ApiResponse> enableGeofence(String userId) {
    return _client.post('/api/geofence/$userId/enable');
  }

  /// 禁用围栏
  Future<ApiResponse> disableGeofence(String userId) {
    return _client.post('/api/geofence/$userId/disable');
  }

  /// 获取位置历史
  Future<ApiResponse> getLocationHistory(String userId) {
    return _client.get('/api/history/track/$userId');
  }

  /// 获取越界警报
  Future<ApiResponse> getAlerts(String userId) {
    return _client.get('/api/history/alerts/$userId');
  }
}
