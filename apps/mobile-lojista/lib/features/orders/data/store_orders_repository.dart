import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/store_order_model.dart';

final storeOrdersRepositoryProvider = Provider<StoreOrdersRepository>((ref) {
  return StoreOrdersRepository(ref.watch(dioProvider));
});

/// Repositorio de pedidos recebidos pela loja, conectado ao backend
/// real (GET /stores/:id/orders).
class StoreOrdersRepository {
  StoreOrdersRepository(this._dio);

  final Dio _dio;

  Future<List<StoreOrderModel>> listOrders(String storeId) async {
    try {
      final response = await _dio.get<List<dynamic>>('/stores/$storeId/orders');
      final data = response.data ?? [];
      return data
          .map((json) => StoreOrderModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
