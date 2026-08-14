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
      final response =
          await _dio.get<List<dynamic>>('/stores/$storeId/products');
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

  /// PATCH /stores/:id/products/:productId — edicao do proprio lojista.
  /// `status` (quando enviado) so alterna `active`/`inactive`; o backend
  /// rejeita qualquer tentativa de sair de `pending_approval`/`rejected`
  /// por aqui.
  Future<StoreProduct> updateProduct({
    required String storeId,
    required String productId,
    String? name,
    String? description,
    double? price,
    int? stockQuantity,
    CatalogTarget? catalogTarget,
    String? status,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/stores/$storeId/products/$productId',
        data: {
          if (name != null) 'name': name,
          if (description != null) 'description': description,
          if (price != null) 'price': price,
          if (stockQuantity != null) 'stockQuantity': stockQuantity,
          if (catalogTarget != null)
            'catalogTarget': catalogTargetToBackend(catalogTarget),
          if (status != null) 'status': status,
        },
      );
      return StoreProduct.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
