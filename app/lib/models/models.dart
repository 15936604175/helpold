/// 求助请求模型
class HelpRequest {
  final String id;
  final String seekerId;
  final double latitude;
  final double longitude;
  final String? address;
  final String? disabilityType;
  final String? disabilityDetail;
  final String? reason;
  final bool sharePhone;
  final String? seekerPhone;
  final String status; // pending / accepted / cancelled / resolved
  final String? acceptedBy;
  final String? stage; // filtering / ready
  final String? createdAt;
  final String? resolvedAt;
  final String? seekerNickname;
  final double? distance;

  HelpRequest({
    required this.id,
    required this.seekerId,
    required this.latitude,
    required this.longitude,
    this.address,
    this.disabilityType,
    this.disabilityDetail,
    this.reason,
    this.sharePhone = false,
    this.seekerPhone,
    required this.status,
    this.acceptedBy,
    this.stage,
    this.createdAt,
    this.resolvedAt,
    this.seekerNickname,
    this.distance,
  });

  factory HelpRequest.fromJson(Map<String, dynamic> json) {
    return HelpRequest(
      id: json['id'] as String,
      seekerId: json['seeker_id'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      address: json['address'] as String?,
      disabilityType: json['disability_type'] as String?,
      disabilityDetail: json['disability_detail'] as String?,
      reason: json['reason'] as String?,
      sharePhone: (json['share_phone'] ?? 0) == 1,
      seekerPhone: json['seeker_phone'] as String?,
      status: json['status'] as String,
      acceptedBy: json['accepted_by'] as String?,
      stage: json['stage'] as String?,
      createdAt: json['created_at'] as String?,
      resolvedAt: json['resolved_at'] as String?,
      seekerNickname: json['seeker_nickname'] as String?,
      distance: json['distance'] != null
          ? (json['distance'] as num).toDouble()
          : null,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return '等待帮助';
      case 'accepted':
        return '已接单';
      case 'cancelled':
        return '已取消';
      case 'resolved':
        return '已完成';
      default:
        return status;
    }
  }
}

/// 位置追踪记录
class LocationTracking {
  final String id;
  final String seekerId;
  final String? guardianId;
  final double? latitude;
  final double? longitude;
  final String? address;
  final String status; // pending / confirmed / denied / timeout
  final String? requestedAt;
  final String? respondedAt;
  final String? completedAt;
  final String? guardianNickname;
  final String? seekerNickname;

  LocationTracking({
    required this.id,
    required this.seekerId,
    this.guardianId,
    this.latitude,
    this.longitude,
    this.address,
    required this.status,
    this.requestedAt,
    this.respondedAt,
    this.completedAt,
    this.guardianNickname,
    this.seekerNickname,
  });

  factory LocationTracking.fromJson(Map<String, dynamic> json) {
    return LocationTracking(
      id: json['id'] as String,
      seekerId: json['seeker_id'] as String,
      guardianId: json['guardian_id'] as String?,
      latitude: json['latitude'] != null
          ? (json['latitude'] as num).toDouble()
          : null,
      longitude: json['longitude'] != null
          ? (json['longitude'] as num).toDouble()
          : null,
      address: json['address'] as String?,
      status: json['status'] as String,
      requestedAt: json['requested_at'] as String?,
      respondedAt: json['responded_at'] as String?,
      completedAt: json['completed_at'] as String?,
      guardianNickname: json['guardian_nickname'] as String?,
      seekerNickname: json['seeker_nickname'] as String?,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return '等待确认';
      case 'confirmed':
        return '已确认';
      case 'denied':
        return '已拒绝';
      case 'timeout':
        return '已超时';
      default:
        return status;
    }
  }
}

/// 推送通知
class AppNotification {
  final String id;
  final String recipientId;
  final String type;
  final String? title;
  final String? body;
  final String? data;
  final String status;
  final String? createdAt;

  AppNotification({
    required this.id,
    required this.recipientId,
    required this.type,
    this.title,
    this.body,
    this.data,
    required this.status,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      recipientId: json['recipient_id'] as String,
      type: json['type'] as String,
      title: json['title'] as String?,
      body: json['body'] as String?,
      data: json['data'] as String?,
      status: json['status'] as String,
      createdAt: json['created_at'] as String?,
    );
  }

  /// 通知类型对应的图标
  String get typeLabel {
    switch (type) {
      case 'location_request':
        return '位置请求';
      case 'help_request':
        return '求助';
      case 'accepted':
        return '已接单';
      case 'cancelled':
        return '已取消';
      case 'track_request':
        return '追踪请求';
      default:
        return type;
    }
  }
}

/// 电子围栏配置
class Geofence {
  final String? id;
  final String userId;
  final double latitude;
  final double longitude;
  final int radius;
  final bool enabled;
  final String? createdAt;
  final String? updatedAt;

  Geofence({
    this.id,
    required this.userId,
    required this.latitude,
    required this.longitude,
    required this.radius,
    this.enabled = true,
    this.createdAt,
    this.updatedAt,
  });

  factory Geofence.fromJson(Map<String, dynamic> json) {
    return Geofence(
      id: json['id'] as String?,
      userId: json['user_id'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      radius: (json['radius'] as num).toInt(),
      enabled: (json['enabled'] ?? 1) == 1,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );
  }
}

/// 位置历史记录
class LocationHistory {
  final String id;
  final String userId;
  final double latitude;
  final double longitude;
  final String? address;
  final double? accuracy;
  final String? trackingMode;
  final bool isOutsideGeofence;
  final String? createdAt;

  LocationHistory({
    required this.id,
    required this.userId,
    required this.latitude,
    required this.longitude,
    this.address,
    this.accuracy,
    this.trackingMode,
    this.isOutsideGeofence = false,
    this.createdAt,
  });

  factory LocationHistory.fromJson(Map<String, dynamic> json) {
    return LocationHistory(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      address: json['address'] as String?,
      accuracy: json['accuracy'] != null
          ? (json['accuracy'] as num).toDouble()
          : null,
      trackingMode: json['tracking_mode'] as String?,
      isOutsideGeofence: (json['is_outside_geofence'] ?? 0) == 1,
      createdAt: json['created_at'] as String?,
    );
  }
}

/// 越界警报
class GeofenceAlert {
  final String id;
  final String userId;
  final double latitude;
  final double longitude;
  final String alertType;
  final bool notified;
  final String? createdAt;

  GeofenceAlert({
    required this.id,
    required this.userId,
    required this.latitude,
    required this.longitude,
    required this.alertType,
    this.notified = false,
    this.createdAt,
  });

  factory GeofenceAlert.fromJson(Map<String, dynamic> json) {
    return GeofenceAlert(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      alertType: json['alert_type'] as String,
      notified: (json['notified'] ?? 0) == 1,
      createdAt: json['created_at'] as String?,
    );
  }
}

/// 监护关系
class GuardianRelation {
  final String id;
  final String seekerId;
  final String guardianId;
  final String relation;
  final String? createdAt;
  final String? seekerNickname;
  final String? seekerDisabilityType;

  GuardianRelation({
    required this.id,
    required this.seekerId,
    required this.guardianId,
    required this.relation,
    this.createdAt,
    this.seekerNickname,
    this.seekerDisabilityType,
  });

  factory GuardianRelation.fromJson(Map<String, dynamic> json) {
    return GuardianRelation(
      id: json['id'] as String,
      seekerId: json['seeker_id'] as String,
      guardianId: json['guardian_id'] as String,
      relation: json['relation'] as String,
      createdAt: json['created_at'] as String?,
      seekerNickname: json['seeker_nickname'] as String?,
      seekerDisabilityType: json['seeker_disability_type'] as String?,
    );
  }
}

/// 帮助者固定位置计划条目
class LocationSchedule {
  final String? id;
  final String userId;
  final String name;
  final int dayOfWeek; // 0=周日, 1-6=周一至周六
  final String startTime; // HH:MM
  final String endTime; // HH:MM
  final double latitude;
  final double longitude;
  final String address;
  final String? addressDetail;
  final bool enabled;
  final String? createdAt;
  final String? updatedAt;

  LocationSchedule({
    this.id,
    required this.userId,
    required this.name,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.latitude,
    required this.longitude,
    required this.address,
    this.addressDetail,
    this.enabled = true,
    this.createdAt,
    this.updatedAt,
  });

  factory LocationSchedule.fromJson(Map<String, dynamic> json) {
    return LocationSchedule(
      id: json['id'] as String?,
      userId: json['user_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      dayOfWeek: (json['day_of_week'] as num?)?.toInt() ?? 0,
      startTime: json['start_time'] as String? ?? '00:00',
      endTime: json['end_time'] as String? ?? '23:59',
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      address: json['address'] as String? ?? '',
      addressDetail: json['address_detail'] as String?,
      enabled: (json['enabled'] ?? 1) == 1,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'day_of_week': dayOfWeek,
    'start_time': startTime,
    'end_time': endTime,
    'latitude': latitude,
    'longitude': longitude,
    'address': address,
    'address_detail': addressDetail,
    'enabled': enabled ? 1 : 0,
  };

  /// 星期几的中文显示
  String get dayOfWeekLabel {
    const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return labels[dayOfWeek.clamp(0, 6)];
  }

  /// 时间段显示
  String get timeRangeLabel => '$startTime - $endTime';
}

/// 帮助者当前匹配到的位置信息
class CurrentLocation {
  final String? planId;
  final String? planName;
  final double? latitude;
  final double? longitude;
  final String? address;
  final int? dayOfWeek;
  final String? startTime;
  final String? endTime;

  CurrentLocation({
    this.planId,
    this.planName,
    this.latitude,
    this.longitude,
    this.address,
    this.dayOfWeek,
    this.startTime,
    this.endTime,
  });

  factory CurrentLocation.fromJson(Map<String, dynamic> json) {
    return CurrentLocation(
      planId: json['plan_id'] as String?,
      planName: json['plan_name'] as String?,
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
      address: json['address'] as String?,
      dayOfWeek: json['day_of_week'] != null ? (json['day_of_week'] as num).toInt() : null,
      startTime: json['start_time'] as String?,
      endTime: json['end_time'] as String?,
    );
  }
}
