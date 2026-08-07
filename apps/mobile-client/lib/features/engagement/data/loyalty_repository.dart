import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/loyalty_balance_model.dart';

final loyaltyRepositoryProvider = Provider<LoyaltyRepository>((ref) {
  return LoyaltyRepository(ref.watch(dioProvider));
});

/// Repositorio de fidelidade GIUCAR (modulo `loyalty`).
class LoyaltyRepository {
  LoyaltyRepository(this._dio);

  final Dio _dio;

  Future<LoyaltyBalanceModel> fetchBalance() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/loyalty/balance');
      return LoyaltyBalanceModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
