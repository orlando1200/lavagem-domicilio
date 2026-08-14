import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/vehicle_model.dart';

final vehiclesRepositoryProvider = Provider<VehiclesRepository>((ref) {
  return VehiclesRepository(ref.watch(dioProvider));
});

/// Repositorio de veiculos do cliente, conectado ao backend real
/// (VehiclesModule): POST /vehicles, GET /vehicles/me (array puro,
/// sem paginacao).
class VehiclesRepository {
  VehiclesRepository(this._dio);

  final Dio _dio;

  Future<List<VehicleModel>> fetchMine() async {
    try {
      final response = await _dio.get<List<dynamic>>('/vehicles/me');
      final items = response.data ?? [];
      return items
          .map((json) => VehicleModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<VehicleModel> create({
    required VehicleType type,
    required String brand,
    required String model,
    String? color,
    required String plate,
  }) async {
    try {
      final response =
          await _dio.post<Map<String, dynamic>>('/vehicles', data: {
        'type': type.name,
        'brand': brand,
        'model': model,
        if (color != null && color.isNotEmpty) 'color': color,
        'plate': plate,
      });
      return VehicleModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
