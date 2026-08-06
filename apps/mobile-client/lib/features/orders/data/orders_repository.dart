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
}
