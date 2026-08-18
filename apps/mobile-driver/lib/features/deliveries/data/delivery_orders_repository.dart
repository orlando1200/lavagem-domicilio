import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_exception.dart';
import 'models/delivery_order_models.dart';

final deliveryOrdersRepositoryProvider = Provider<DeliveryOrdersRepository>((ref) {
  return DeliveryOrdersRepository(ref.watch(dioProvider));
});

/// Repositorio de entregas de produtos da Loja do Lavador, conectado ao
/// backend real (DeliveriesModule):
///   GET   /driver/deliveries          — lista entregas pendentes disponiveis
///   GET   /driver/deliveries/active   — entrega ativa do lavador logado
///   PATCH /driver/deliveries/:id/accept        — aceitar entrega
///   PATCH /driver/deliveries/:id/status { status } — avancar status
class DeliveryOrdersRepository {
  DeliveryOrdersRepository(this._dio);

  final Dio _dio;

  Future<List<DeliveryOrder>> listAvailable() async {
    try {
      final response = await _dio.get('/driver/deliveries');
      final items = (response.data['items'] as List<dynamic>?) ?? const [];
      return items
          .map((item) => DeliveryOrder.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<Map<String, dynamic>?> getActive() async {
    try {
      final response = await _dio.get('/driver/deliveries/active');
      return response.data as Map<String, dynamic>?;
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> acceptDelivery(String deliveryId) async {
    try {
      await _dio.patch('/driver/deliveries/$deliveryId/accept');
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// [backendStatus] segue o enum `ProductOrderDeliveryStatus` do backend:
  /// PENDING, ACCEPTED, ON_THE_WAY, DELIVERED, CANCELLED.
  Future<void> updateStatus(String deliveryId, String backendStatus) async {
    try {
      await _dio.patch(
        '/driver/deliveries/$deliveryId/status',
        data: {'status': backendStatus},
      );
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
