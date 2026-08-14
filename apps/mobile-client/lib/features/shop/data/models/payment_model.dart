/// Payment cru vindo de `GET /payments/orders/:orderId` — diferente de
/// `PaymentIntentModel`, que e o shape `{payment, gateway}` retornado
/// na criacao (POST /payments/intent).
class PaymentModel {
  const PaymentModel({
    required this.id,
    required this.status,
    required this.method,
    this.externalRef,
  });

  final String id;
  final String status;
  final String method;
  final String? externalRef;

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'] as String,
      status: json['status'] as String,
      method: json['method'] as String,
      externalRef: json['externalRef'] as String?,
    );
  }
}
