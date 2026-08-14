import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/presentation/providers/auth_provider.dart';
import 'data/models/store_product.dart';
import 'data/products_repository.dart';

/// FutureProvider.autoDispose para a lista de produtos da loja do
/// lojista logado (GET /stores/:id/products). Retorna lista vazia
/// quando ainda nao ha `storeId` disponivel (ex.: sessao restaurada sem
/// cadastro de loja concluido).
final storeProductsProvider =
    FutureProvider.autoDispose<List<StoreProduct>>((ref) async {
  final authState = ref.watch(authProvider);
  final storeId = authState.maybeWhen(
    authenticated: (user) => user.storeId,
    orElse: () => null,
  );
  if (storeId == null) return [];
  return ref.watch(productsRepositoryProvider).listProducts(storeId);
});
