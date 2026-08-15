/// Uma entrada do historico de fidelidade (GET /loyalty/history) —
/// concessao (`LoyaltyPoint`) ou resgate (`LoyaltyRedemption`),
/// unificadas num unico model pra exibicao em lista cronologica.
class LoyaltyHistoryEntry {
  const LoyaltyHistoryEntry({
    required this.isGrant,
    required this.amount,
    required this.createdAt,
    this.expiresAt,
    this.redeemedAmount,
  });

  final bool isGrant;
  final int amount;
  final DateTime createdAt;

  /// Só presente em concessões.
  final DateTime? expiresAt;

  /// Só presente em concessões — quanto já foi consumido dela.
  final int? redeemedAmount;

  factory LoyaltyHistoryEntry.grant(Map<String, dynamic> json) {
    return LoyaltyHistoryEntry(
      isGrant: true,
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'] as String)
          : null,
      redeemedAmount: (json['redeemedAmount'] as num?)?.toInt(),
    );
  }

  factory LoyaltyHistoryEntry.redemption(Map<String, dynamic> json) {
    return LoyaltyHistoryEntry(
      isGrant: false,
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
