double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Repasse (Payout) da loja, espelhando GET /payouts/me/store.
class StorePayoutModel {
  const StorePayoutModel({
    required this.id,
    required this.status,
    required this.netAmount,
    this.paidAt,
  });

  final String id;
  final String status;
  final double netAmount;
  final DateTime? paidAt;

  factory StorePayoutModel.fromJson(Map<String, dynamic> json) {
    return StorePayoutModel(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'pending',
      netAmount: _parseDouble(json['netAmount']),
      paidAt: json['paidAt'] != null
          ? DateTime.tryParse(json['paidAt'] as String)
          : null,
    );
  }
}
