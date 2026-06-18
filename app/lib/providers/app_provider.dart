import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/user.dart';

/// 本地存储（替代 SharedPreferences，使用文件持久化）
///
/// 由于环境无法下载 path_provider 包，使用 Directory.current 作为存储目录。
/// 在 Android 上，这通常是应用沙箱目录（/data/data/<package>/app_flutter）。
class LocalStorage {
  static final LocalStorage _instance = LocalStorage._internal();
  factory LocalStorage() => _instance;
  LocalStorage._internal();

  File? _file;
  Map<String, dynamic> _data = {};

  Future<void> init() async {
    try {
      final dir = Directory.current;
      _file = File('${dir.path}/helpold_storage.json');
      if (_file!.existsSync()) {
        final content = _file!.readAsStringSync();
        _data = jsonDecode(content) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[LocalStorage] 初始化失败: $e');
      _file = null;
    }
  }

  Future<void> _save() async {
    if (_file == null) return;
    try {
      _file!.writeAsStringSync(jsonEncode(_data));
    } catch (e) {
      debugPrint('[LocalStorage] 保存失败: $e');
    }
  }

  String? getString(String key) => _data[key]?.toString();
  bool? getBool(String key) => _data[key] as bool?;
  int? getInt(String key) => _data[key] as int?;

  Future<void> setString(String key, String? value) async {
    if (value == null) {
      _data.remove(key);
    } else {
      _data[key] = value;
    }
    await _save();
  }

  Future<void> setBool(String key, bool? value) async {
    if (value == null) {
      _data.remove(key);
    } else {
      _data[key] = value;
    }
    await _save();
  }

  Future<void> remove(String key) async {
    _data.remove(key);
    await _save();
  }

  Future<void> clear() async {
    _data.clear();
    await _save();
  }
}

/// 全局应用状态
///
/// 使用 ChangeNotifier（Flutter 自带）实现响应式状态管理，
/// 通过全局单例 `appProvider` 访问，配合 ListenableBuilder 监听变化。
/// 不依赖 provider 包。
class AppProvider extends ChangeNotifier {
  static final AppProvider _instance = AppProvider._internal();
  factory AppProvider() => _instance;
  AppProvider._internal();

  final LocalStorage _storage = LocalStorage();

  User? _user;
  String? _token;
  bool _initialized = false;

  /// 当前 UI 模式：seeker / helper
  String _currentMode = 'seeker';

  User? get user => _user;
  String? get token => _token;
  bool get isInitialized => _initialized;
  bool get isLoggedIn => _token != null && _user != null;
  String get currentMode => _currentMode;

  bool get isSeekerMode => _currentMode == 'seeker';
  bool get isHelperMode => _currentMode == 'helper';
  bool get canSwitchMode => true;

  /// 初始化：从本地存储恢复登录态
  Future<void> init() async {
    await _storage.init();
    final savedToken = _storage.getString('token');
    final savedUserJson = _storage.getString('user');
    final savedMode = _storage.getString('current_mode');

    if (savedToken != null && savedUserJson != null) {
      try {
        _token = savedToken;
        _user = User.fromJson(
            jsonDecode(savedUserJson) as Map<String, dynamic>);
        _currentMode = savedMode ?? _user!.role;
        if (_currentMode != 'seeker' && _currentMode != 'helper') {
          _currentMode = _user!.role == 'seeker' ? 'seeker' : 'helper';
        }
      } catch (e) {
        debugPrint('[AppProvider] 恢复登录态失败: $e');
        await logout();
      }
    }
    _initialized = true;
    notifyListeners();
  }

  Future<void> setLogin(String token, User user) async {
    _token = token;
    _user = user;
    _currentMode = user.role == 'seeker' ? 'seeker' : 'helper';
    await _storage.setString('token', token);
    await _storage.setString('user', jsonEncode(user.toJson()));
    await _storage.setString('current_mode', _currentMode);
    notifyListeners();
  }

  Future<void> updateUser(User user) async {
    _user = user;
    await _storage.setString('user', jsonEncode(user.toJson()));
    notifyListeners();
  }

  Future<void> switchMode(String mode) async {
    if (mode != 'seeker' && mode != 'helper') return;
    _currentMode = mode;
    await _storage.setString('current_mode', mode);
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _currentMode = 'seeker';
    await _storage.remove('token');
    await _storage.remove('user');
    await _storage.remove('current_mode');
    notifyListeners();
  }
}

/// 全局 AppProvider 单例
final AppProvider appProvider = AppProvider();
