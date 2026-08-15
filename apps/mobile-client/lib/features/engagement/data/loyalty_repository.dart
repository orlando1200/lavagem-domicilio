import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/loyalty_balance_model.dart';
import 'models/loyalty_history_model.dart';

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

  /// GET /loyalty/history devolve `{ grants, redemptions }` separados —
  /// unifica os dois numa unica lista cronologica (mais recente primeiro).
  Future<List<LoyaltyHistoryEntry>> fetchHistory() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/loyalty/history');
      final data = response.data!;
      final grants = (data['grants'] as List<dynamic>? ?? [])
          .map(
              (json) => LoyaltyHistoryEntry.grant(json as Map<String, dynamic>))
          .toList();
      final redemptions = (data['redemptions'] as List<dynamic>? ?? [])
          .map((json) =>
              LoyaltyHistoryEntry.redemption(json as Map<String, dynamic>))
          .toList();
      final entries = [...grants, ...redemptions];
      entries.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return entries;
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
