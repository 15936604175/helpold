/// 用户模型
class User {
  final String id;
  final String phone;
  final String nickname;
  final String role; // seeker / helper / guardian
  final String? disabilityType;
  final String? disabilityDetail;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final bool sharePhone;
  final bool locationAuth;
  final bool autoConsent;
  final bool continuousTracking;
  final int trackingInterval;
  final int geofenceRadius;
  final bool nightModeEnabled;
  final String? createdAt;

  User({
    required this.id,
    required this.phone,
    required this.nickname,
    required this.role,
    this.disabilityType,
    this.disabilityDetail,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.sharePhone = false,
    this.locationAuth = true,
    this.autoConsent = false,
    this.continuousTracking = false,
    this.trackingInterval = 600,
    this.geofenceRadius = 500,
    this.nightModeEnabled = true,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      phone: json['phone'] as String,
      nickname: json['nickname'] as String,
      role: json['role'] as String,
      disabilityType: json['disability_type'] as String?,
      disabilityDetail: json['disability_detail'] as String?,
      emergencyContactName: json['emergency_contact_name'] as String?,
      emergencyContactPhone: json['emergency_contact_phone'] as String?,
      sharePhone: (json['share_phone'] ?? 0) == 1,
      locationAuth: (json['location_auth'] ?? 1) == 1,
      autoConsent: (json['auto_consent'] ?? 0) == 1,
      continuousTracking: (json['continuous_tracking'] ?? 0) == 1,
      trackingInterval: (json['tracking_interval'] ?? 600) as int,
      geofenceRadius: (json['geofence_radius'] ?? 500) as int,
      nightModeEnabled: (json['night_mode_enabled'] ?? 1) == 1,
      createdAt: json['created_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'nickname': nickname,
        'role': role,
        'disability_type': disabilityType,
        'disability_detail': disabilityDetail,
        'emergency_contact_name': emergencyContactName,
        'emergency_contact_phone': emergencyContactPhone,
        'share_phone': sharePhone ? 1 : 0,
        'location_auth': locationAuth ? 1 : 0,
        'auto_consent': autoConsent ? 1 : 0,
        'continuous_tracking': continuousTracking ? 1 : 0,
        'tracking_interval': trackingInterval,
        'geofence_radius': geofenceRadius,
        'night_mode_enabled': nightModeEnabled ? 1 : 0,
        'created_at': createdAt,
      };

  /// 是否为求助者
  bool get isSeeker => role == 'seeker';

  /// 是否为帮助者
  bool get isHelper => role == 'helper';

  /// 是否为紧急联系人/监护人
  bool get isGuardian => role == 'guardian';

  /// 是否为老年痴呆患者（用于显示追踪子模块）
  bool get isDementia => disabilityType == '老年痴呆';

  User copyWith({
    String? nickname,
    String? disabilityType,
    String? disabilityDetail,
    bool? continuousTracking,
    int? trackingInterval,
    int? geofenceRadius,
    bool? nightModeEnabled,
    bool? autoConsent,
  }) {
    return User(
      id: id,
      phone: phone,
      nickname: nickname ?? this.nickname,
      role: role,
      disabilityType: disabilityType ?? this.disabilityType,
      disabilityDetail: disabilityDetail ?? this.disabilityDetail,
      emergencyContactName: emergencyContactName,
      emergencyContactPhone: emergencyContactPhone,
      sharePhone: sharePhone,
      locationAuth: locationAuth,
      autoConsent: autoConsent ?? this.autoConsent,
      continuousTracking: continuousTracking ?? this.continuousTracking,
      trackingInterval: trackingInterval ?? this.trackingInterval,
      geofenceRadius: geofenceRadius ?? this.geofenceRadius,
      nightModeEnabled: nightModeEnabled ?? this.nightModeEnabled,
      createdAt: createdAt,
    );
  }
}
