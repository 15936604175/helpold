import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';

/// 统一 API 响应封装
class ApiResponse {
  final bool success;
  final dynamic data;
  final String? error;
  final int statusCode;

  const ApiResponse({
    required this.success,
    this.data,
    this.error,
    required this.statusCode,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json, int statusCode) {
    return ApiResponse(
      success: json['success'] == true,
      data: json,
      error: json['error'] as String?,
      statusCode: statusCode,
    );
  }
}

/// HTTP 客户端封装
///
/// 由于环境无法下载第三方包，使用 dart:io 的 HttpClient 实现。
/// 统一处理：baseURL 拼接、JSON 序列化、Token 注入、错误处理。
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String? _token;

  String? get token => _token;

  void setToken(String? token) {
    _token = token;
  }

  void clearToken() {
    _token = null;
  }

  Future<ApiResponse> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    final uri = Uri.parse('${AppConfig.baseUrl}$path').replace(
      queryParameters: queryParams,
    );

    try {
      final client = HttpClient();
      client.connectionTimeout = const Duration(seconds: 10);

      final request = await client.openUrl(method, uri);

      // 注入 Token
      if (_token != null) {
        request.headers.set('Authorization', 'Bearer $_token');
      }
      request.headers.contentType = ContentType.json;

      // 写入请求体
      if (body != null) {
        request.write(jsonEncode(body));
      }

      final response = await request.close();
      final responseBody = await response.transform(utf8.decoder).join();
      client.close();

      Map<String, dynamic> json;
      try {
        json = jsonDecode(responseBody) as Map<String, dynamic>;
      } catch (_) {
        return ApiResponse(
          success: false,
          error: '响应格式错误: $responseBody',
          statusCode: response.statusCode,
        );
      }

      return ApiResponse.fromJson(json, response.statusCode);
    } on SocketException catch (e) {
      debugPrint('[ApiClient] 网络错误: $e');
      return ApiResponse(
        success: false,
        error: '网络连接失败，请检查网络或服务器地址',
        statusCode: -1,
      );
    } on HttpException catch (e) {
      debugPrint('[ApiClient] HTTP 错误: $e');
      return ApiResponse(
        success: false,
        error: 'HTTP 错误: ${e.message}',
        statusCode: -2,
      );
    } catch (e) {
      debugPrint('[ApiClient] 未知错误: $e');
      return ApiResponse(
        success: false,
        error: '请求失败: $e',
        statusCode: -3,
      );
    }
  }

  Future<ApiResponse> get(String path, {Map<String, String>? query}) =>
      _request('GET', path, queryParams: query);

  Future<ApiResponse> post(String path, {Map<String, dynamic>? body}) =>
      _request('POST', path, body: body);

  Future<ApiResponse> put(String path, {Map<String, dynamic>? body}) =>
      _request('PUT', path, body: body);

  Future<ApiResponse> delete(String path, {Map<String, dynamic>? body}) =>
      _request('DELETE', path, body: body);
}
