import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/constants/app_constants.dart';

final storePlanRepositoryProvider = Provider<StorePlanRepository>((ref) {
  return StorePlanRepository(ref.watch(dioProvider));
});

String _logisticsModeToBackend(LogisticsMode mode) {
  switch (mode) {
    case LogisticsMode.integrada:
      return 'INTEGRATED';
    case LogisticsMode.propria:
      return 'OWN';
  }
}

/// Repositorio de troca de plano da loja, conectado ao backend real
/// (PATCH /stores/:id/logistics-plan — recalcula o CommissionPlan).
class StorePlanRepository {
  StorePlanRepository(this._dio);

  final Dio _dio;

  Future<void> updateLogisticsPlan(String storeId, LogisticsMode mode) async {
    try {
      await _dio.patch<Map<String, dynamic>>(
        '/stores/$storeId/logistics-plan',
        data: {'logisticsPlan': _logisticsModeToBackend(mode)},
      );
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
