import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/wash_price_model.dart';

final washPricingRepositoryProvider = Provider<WashPricingRepository>((ref) {
  return WashPricingRepository(ref.watch(dioProvider));
});

/// Repositorio da matriz de precos de Servicos Auto (GET /wash-pricing/matrix).
class WashPricingRepository {
  WashPricingRepository(this._dio);

  final Dio _dio;

  Future<List<WashPriceEntry>> fetchMatrix() async {
    try {
      final response = await _dio.get<List<dynamic>>('/wash-pricing/matrix');
      final items = response.data ?? [];
      return items.map((j) => WashPriceEntry.fromJson(j as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
