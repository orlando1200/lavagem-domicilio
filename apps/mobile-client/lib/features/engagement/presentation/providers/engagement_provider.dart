import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/loyalty_repository.dart';
import '../../data/models/loyalty_balance_model.dart';
import '../../data/models/loyalty_history_model.dart';

/// Saldo de fidelidade real do cliente (GET /loyalty/balance).
final engagementProvider =
    FutureProvider.autoDispose<LoyaltyBalanceModel>((ref) {
  return ref.watch(loyaltyRepositoryProvider).fetchBalance();
});

/// Historico de fidelidade real do cliente (GET /loyalty/history).
final engagementHistoryProvider =
    FutureProvider.autoDispose<List<LoyaltyHistoryEntry>>((ref) {
  return ref.watch(loyaltyRepositoryProvider).fetchHistory();
});
