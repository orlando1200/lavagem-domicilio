double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Saldo de fidelidade real (GET /loyalty/balance). Sem sistema de
/// metas/tiers: `nextExpirationAmount`/`nextExpirationAt` sao os
/// proximos pontos a vencer (unico "proximo marco" que existe de
/// verdade no modelo — resgate e sempre parcial, a qualquer momento).
class LoyaltyBalanceModel {
  const LoyaltyBalanceModel({
    required this.balance,
    required this.balanceValue,
    required this.streakDays,
    required this.totalSaved,
    this.nextExpirationAmount,
    this.nextExpirationAt,
  });

  final int balance;
  final double balanceValue;
  final int streakDays;
  final double totalSaved;
  final int? nextExpirationAmount;
  final DateTime? nextExpirationAt;

  factory LoyaltyBalanceModel.fromJson(Map<String, dynamic> json) {
    final nextExpiration = json['nextExpiration'] as Map<String, dynamic>?;
    return LoyaltyBalanceModel(
      balance: (json['balance'] as num?)?.toInt() ?? 0,
      balanceValue: _parseDouble(json['balanceValue']),
      streakDays: (json['streakDays'] as num?)?.toInt() ?? 0,
      totalSaved: _parseDouble(json['totalSaved']),
      nextExpirationAmount: (nextExpiration?['amount'] as num?)?.toInt(),
      nextExpirationAt: nextExpiration?['expiresAt'] != null
          ? DateTime.tryParse(nextExpiration!['expiresAt'] as String)
          : null,
    );
  }
}
