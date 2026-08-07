/// Resultado de POST /payments/intent — payment persistido + dados do
/// gateway mock (Mercado Pago).
class PaymentIntentModel {
  const PaymentIntentModel({
    required this.paymentId,
    required this.status,
    this.externalRef,
    this.qrCode,
    this.checkoutUrl,
  });

  final String paymentId;
  final String status;
  final String? externalRef;
  final String? qrCode;
  final String? checkoutUrl;

  factory PaymentIntentModel.fromJson(Map<String, dynamic> json) {
    final payment = json['payment'] as Map<String, dynamic>?;
    final gateway = json['gateway'] as Map<String, dynamic>?;
    return PaymentIntentModel(
      paymentId: payment?['id'] as String? ?? '',
      status: payment?['status'] as String? ?? 'pending',
      externalRef: payment?['externalRef'] as String? ?? gateway?['externalRef'] as String?,
      qrCode: gateway?['qrCode'] as String?,
      checkoutUrl: gateway?['checkoutUrl'] as String?,
    );
  }
}
