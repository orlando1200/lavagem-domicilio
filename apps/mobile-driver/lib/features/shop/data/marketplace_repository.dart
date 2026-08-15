import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../presentation/providers/cart_provider.dart';
import 'models/product_model.dart';
import 'models/product_order_model.dart';
import 'models/shipping_address.dart';

final marketplaceRepositoryProvider = Provider<MarketplaceRepository>((ref) {
  return MarketplaceRepository(ref.watch(dioProvider));
});

/// Repositorio da Loja de Produtos do lavador (modulo `marketplace`):
/// catalogo de insumos/produtos voltados pro lavador repor seu kit, e
/// checkout — reaproveita o mesmo `POST /marketplace/client/checkout`
/// do app cliente (endpoint agnostico ao role do comprador, so muda
/// qual catalogo alimenta o carrinho).
class MarketplaceRepository {
  MarketplaceRepository(this._dio);

  final Dio _dio;

  /// Cursor/paginacao ja suportados pelo backend, mas nao usados nesta
  /// rodada — busca so a primeira pagina (limit padrao 20); filtro de
  /// categoria/busca continua client-side.
  Future<List<ProductModel>> fetchDriverCatalog() async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/marketplace/driver/catalog');
      final items = (response.data?['items'] as List<dynamic>?) ?? [];
      return items
          .map((json) => ProductModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<ProductModel> fetchProduct(String id) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/marketplace/products/$id');
      return ProductModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<List<ProductOrderModel>> checkout({
    required List<CartItem> items,
    required ShippingAddress address,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/marketplace/client/checkout',
        data: {
          'items': items
              .map((item) =>
                  {'productId': item.product.id, 'quantity': item.quantity})
              .toList(),
          'shippingAddress': address.toJson(),
        },
      );
      final orders = (response.data?['orders'] as List<dynamic>?) ?? [];
      return orders
          .map((json) =>
              ProductOrderModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
