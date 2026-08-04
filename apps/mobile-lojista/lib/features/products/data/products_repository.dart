import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/constants/app_constants.dart';
import 'models/store_product.dart';

final productsRepositoryProvider = Provider<ProductsRepository>((ref) {
  return ProductsRepository(ref.watch(dioProvider));
});

/// Repositorio de produtos do lojista, conectado ao backend real
/// (GET/POST /stores/:id/products).
class ProductsRepository {
  ProductsRepository(this._dio);

  final Dio _dio;

  Future<List<StoreProduct>> listProducts(String storeId) async {
    try {
      final response = await _dio.get<List<dynamic>>('/stores/$storeId/products');
      final data = response.data ?? [];
      return data
          .map((json) => StoreProduct.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<StoreProduct> createProduct({
    required String storeId,
    required String name,
    required String description,
    required double price,
    required int stockQuantity,
    required CatalogTarget catalogTarget,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/stores/$storeId/products',
        data: {
          'name': name,
          'description': description,
          'price': price,
          'stockQuantity': stockQuantity,
          'catalogTarget': catalogTargetToBackend(catalogTarget),
        },
      );
      return StoreProduct.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
