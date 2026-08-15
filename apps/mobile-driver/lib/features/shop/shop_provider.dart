import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'data/marketplace_repository.dart';
import 'data/models/product_model.dart';

/// Catalogo real da Loja de Produtos (GET /marketplace/driver/catalog).
final catalogProvider = FutureProvider.autoDispose<List<ProductModel>>((ref) {
  return ref.watch(marketplaceRepositoryProvider).fetchDriverCatalog();
});

/// Detalhe de um produto (GET /marketplace/products/:id).
final productDetailProvider =
    FutureProvider.autoDispose.family<ProductModel, String>((ref, id) {
  return ref.watch(marketplaceRepositoryProvider).fetchProduct(id);
});
