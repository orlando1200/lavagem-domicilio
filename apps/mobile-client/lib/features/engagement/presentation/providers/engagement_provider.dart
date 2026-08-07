import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/loyalty_repository.dart';
import '../../data/models/loyalty_balance_model.dart';

/// Saldo de fidelidade real do cliente (GET /loyalty/balance).
final engagementProvider = FutureProvider.autoDispose<LoyaltyBalanceModel>((ref) {
  return ref.watch(loyaltyRepositoryProvider).fetchBalance();
});
