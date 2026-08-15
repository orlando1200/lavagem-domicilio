import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/rental_model.dart';

final rentalRepositoryProvider = Provider<RentalRepository>((ref) {
  return RentalRepository(ref.watch(dioProvider));
});

/// Repositorio de aluguel de moto do lavador (RentalModule):
///   POST /rentals/me/request — solicita um aluguel (autoservico)
///   GET  /rentals/me         — aluguel atual/mais recente (null se nunca pediu)
class RentalRepository {
  RentalRepository(this._dio);

  final Dio _dio;

  Future<RentalModel?> fetchMine() async {
    try {
      final response = await _dio.get('/rentals/me');
      if (response.data == null) return null;
      return RentalModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<RentalModel> requestRental() async {
    try {
      final response = await _dio.post('/rentals/me/request');
      return RentalModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
