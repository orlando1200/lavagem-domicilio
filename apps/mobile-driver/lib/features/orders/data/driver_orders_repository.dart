import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_exception.dart';
import 'models/driver_order_model.dart';

final driverOrdersRepositoryProvider = Provider<DriverOrdersRepository>((ref) {
  return DriverOrdersRepository(ref.watch(dioProvider));
});

/// Repositorio de pedidos do lavador, conectado ao backend real
/// (OrdersModule):
///   GET   /orders/available    — fila de pedidos pra aceitar
///   GET   /orders/mine/active  — pedido em andamento, se houver
///   PATCH /orders/:id/accept
///   PATCH /orders/:id/status   { status, reason? }
///   PATCH /orders/:id/cancel
class DriverOrdersRepository {
  DriverOrdersRepository(this._dio);

  final Dio _dio;

  Future<List<DriverOrder>> fetchAvailableOrders() async {
    try {
      final response = await _dio.get<List<dynamic>>('/orders/available');
      return (response.data ?? const [])
          .map((json) => DriverOrder.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Retorna `null` quando o lavador nao tem pedido ativo no momento.
  Future<DriverOrder?> fetchActiveOrder() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/orders/mine/active');
      return response.data != null ? DriverOrder.fromJson(response.data!) : null;
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<DriverOrder> acceptOrder(String orderId) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>('/orders/$orderId/accept');
      return DriverOrder.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<DriverOrder> updateStatus(String orderId, String backendStatus) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/orders/$orderId/status',
        data: {'status': backendStatus},
      );
      return DriverOrder.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> cancel(String orderId) async {
    try {
      await _dio.patch('/orders/$orderId/cancel');
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
