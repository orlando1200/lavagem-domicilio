double _parseAmount(dynamic value) {
  if (value == null) return 0;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? 0;
}

/// Payment cru vindo de `GET /payments/orders/:orderId` e
/// `GET /payments/mine` — diferente de `PaymentIntentModel`, que e o
/// shape `{payment, gateway}` retornado na criacao (POST /payments/intent).
class PaymentModel {
  const PaymentModel({
    required this.id,
    required this.status,
    required this.method,
    required this.amount,
    required this.createdAt,
    this.externalRef,
  });

  final String id;
  final String status;
  final String method;
  final double amount;
  final DateTime createdAt;
  final String? externalRef;

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'] as String,
      status: json['status'] as String,
      method: json['method'] as String,
      amount: _parseAmount(json['amount']),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      externalRef: json['externalRef'] as String?,
    );
  }
}
