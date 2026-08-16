import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../auctions/data/models/driver_profile_model.dart';

final zonesRepositoryProvider = Provider<ZonesRepository>((ref) {
  return ZonesRepository(ref.watch(dioProvider));
});

/// Repositorio de zonas de cobertura ativas (GET /zones — enxuto,
/// so pro lavador escolher a propria area de atuacao).
class ZonesRepository {
  ZonesRepository(this._dio);

  final Dio _dio;

  Future<List<ZoneSummary>> fetchActiveZones() async {
    try {
      final response = await _dio.get<List<dynamic>>('/zones');
      return (response.data ?? [])
          .map((json) => ZoneSummary.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
