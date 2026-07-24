import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'data/models/order_model.dart';
import 'data/orders_repository.dart';

/// FutureProvider.autoDispose para a lista de pedidos do cliente logado.
/// AsyncValue ja modela loading/data/error nativamente (sem crash caso o
/// backend esteja indisponivel).
final myOrdersProvider = FutureProvider.autoDispose<List<OrderModel>>((ref) {
  return ref.watch(ordersRepositoryProvider).fetchMyOrders();
});
