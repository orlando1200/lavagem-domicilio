import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_exception.dart';
import 'models/order_model.dart';

final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  return OrdersRepository(ref.watch(dioProvider));
});

/// Repositorio de pedidos do cliente, conectado a GET /orders (backend
/// real, modulo OrdersModule).
class OrdersRepository {
  OrdersRepository(this._dio);

  final Dio _dio;

  /// GET /orders retorna paginacao por cursor (`{ items, nextCursor }`),
  /// nao um array puro — le apenas `items` (paginacao ainda nao exposta
  /// na UI).
  Future<List<OrderModel>> fetchMyOrders() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/orders');
      final items = (response.data?['items'] as List<dynamic>?) ?? [];
      return items
          .map((json) => OrderModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// POST /orders devolve o Order completo direto (sem wrapper).
  /// Dispara matching automatico no backend (exceto HEAVY_SERVICE, que
  /// fica pending para o fluxo de leilao).
  Future<OrderModel> createOrder({
    required String vehicleId,
    required String addressId,
    String? serviceType,
    required List<Map<String, dynamic>> items,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>('/orders', data: {
        'vehicleId': vehicleId,
        'addressId': addressId,
        if (serviceType != null) 'serviceType': serviceType,
        'items': items,
      });
      return OrderModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// GET /orders/:id devolve o Order completo direto (sem wrapper).
  Future<OrderModel> fetchOrder(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/orders/$id');
      return OrderModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> cancelOrder(String id, {String? reason}) async {
    try {
      await _dio.patch<void>('/orders/$id/cancel', data: {
        if (reason != null && reason.isNotEmpty) 'reason': reason,
      });
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
