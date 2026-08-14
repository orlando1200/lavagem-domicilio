import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/store_payout_model.dart';

final payoutsRepositoryProvider = Provider<PayoutsRepository>((ref) {
  return PayoutsRepository(ref.watch(dioProvider));
});

/// Repositorio de repasses da loja, conectado ao backend real
/// (GET /payouts/me/store).
class PayoutsRepository {
  PayoutsRepository(this._dio);

  final Dio _dio;

  Future<List<StorePayoutModel>> listMyStorePayouts() async {
    try {
      final response = await _dio.get<List<dynamic>>('/payouts/me/store');
      final data = response.data ?? [];
      return data
          .map(
              (json) => StorePayoutModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
