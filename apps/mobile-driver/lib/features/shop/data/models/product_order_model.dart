double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Pedido de produto criado no checkout (POST /marketplace/client/checkout),
/// um por loja envolvida na compra.
class ProductOrderModel {
  const ProductOrderModel({
    required this.id,
    required this.orderNumber,
    required this.storeId,
    required this.subtotal,
    required this.shippingAmount,
    required this.totalAmount,
    required this.paymentStatus,
    this.storeName,
  });

  final String id;
  final String orderNumber;
  final String storeId;
  final double subtotal;
  final double shippingAmount;
  final double totalAmount;
  final String paymentStatus;
  final String? storeName;

  factory ProductOrderModel.fromJson(Map<String, dynamic> json) {
    final store = json['store'] as Map<String, dynamic>?;
    return ProductOrderModel(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String? ?? '',
      storeId: json['storeId'] as String? ?? store?['id'] as String? ?? '',
      subtotal: _parseDouble(json['subtotal']),
      shippingAmount: _parseDouble(json['shippingAmount']),
      totalAmount: _parseDouble(json['totalAmount']),
      paymentStatus: json['paymentStatus'] as String? ?? 'pending',
      storeName: store?['name'] as String?,
    );
  }
}
