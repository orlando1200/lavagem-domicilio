import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/notification_item.dart';

final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  return NotificationsRepository(ref.watch(dioProvider));
});

/// Repositorio de notificacoes in-app (modulo `notifications`,
/// `/notifications/me`), conectado ao backend real.
class NotificationsRepository {
  NotificationsRepository(this._dio);

  final Dio _dio;

  Future<List<NotificationItem>> fetchMine() async {
    try {
      final response = await _dio.get<List<dynamic>>('/notifications/me');
      return response.data!
          .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<int> fetchUnreadCount() async {
    try {
      final response = await _dio.get<int>('/notifications/me/unread-count');
      return response.data ?? 0;
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _dio.patch<Map<String, dynamic>>('/notifications/$id/read');
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _dio.patch<Map<String, dynamic>>('/notifications/me/read-all');
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
