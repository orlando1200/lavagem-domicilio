import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/presentation/providers/auth_provider.dart';
import 'data/models/store_order_model.dart';
import 'data/store_orders_repository.dart';

/// FutureProvider.autoDispose para os pedidos recebidos pela loja do
/// lojista logado (GET /stores/:id/orders). Retorna lista vazia quando
/// ainda nao ha `storeId` disponivel (mesmo padrao de
/// `storeProductsProvider`).
final storeOrdersProvider =
    FutureProvider.autoDispose<List<StoreOrderModel>>((ref) async {
  final authState = ref.watch(authProvider);
  final storeId = authState.maybeWhen(
    authenticated: (user) => user.storeId,
    orElse: () => null,
  );
  if (storeId == null) return [];
  return ref.watch(storeOrdersRepositoryProvider).listOrders(storeId);
});
