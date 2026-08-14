import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'data/models/store_payout_model.dart';
import 'data/payouts_repository.dart';

/// FutureProvider.autoDispose para os repasses da loja do lojista
/// logado (GET /payouts/me/store).
final storePayoutsProvider =
    FutureProvider.autoDispose<List<StorePayoutModel>>((ref) {
  return ref.watch(payoutsRepositoryProvider).listMyStorePayouts();
});
