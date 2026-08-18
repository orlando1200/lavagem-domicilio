import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/service_category_model.dart';

final serviceCategoriesRepositoryProvider = Provider<ServiceCategoriesRepository>((ref) {
  return ServiceCategoriesRepository(ref.watch(dioProvider));
});

/// Repositorio do catalogo de categorias de servico com preco real
/// (GET /service-categories, modulo `service-categories`).
class ServiceCategoriesRepository {
  ServiceCategoriesRepository(this._dio);

  final Dio _dio;

  Future<List<ServiceCategoryModel>> fetchActive() async {
    try {
      final response = await _dio.get<List<dynamic>>('/service-categories');
      return response.data!
          .map((e) => ServiceCategoryModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
