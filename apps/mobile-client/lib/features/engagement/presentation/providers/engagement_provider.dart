import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Estado de engajamento/fidelidade do cliente.
class EngagementState {
  const EngagementState({
    required this.loyaltyPoints,
    required this.nextRewardAt,
    required this.streakDays,
    required this.savedAmount,
  });

  final int loyaltyPoints;
  final int nextRewardAt;
  final int streakDays;
  final double savedAmount;
}

final engagementProvider =
    StateNotifierProvider<EngagementNotifier, EngagementState>((ref) {
  return EngagementNotifier();
});

class EngagementNotifier extends StateNotifier<EngagementState> {
  EngagementNotifier()
      : super(const EngagementState(
          loyaltyPoints: 320,
          nextRewardAt: 500,
          streakDays: 4,
          savedAmount: 87.50,
        ));
}
