/// Decimal do Prisma serializa como string no JSON, nao como numero —
/// parse defensivo que aceita os dois formatos.
double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

class StoreOrderItem {
  const StoreOrderItem(
      {required this.productName,
      required this.quantity,
      required this.totalPrice});

  final String productName;
  final int quantity;
  final double totalPrice;

  factory StoreOrderItem.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>?;
    return StoreOrderItem(
      productName: product?['name'] as String? ?? 'Produto',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      totalPrice: _parseDouble(json['totalPrice']),
    );
  }
}

/// Pedido de produto recebido pela loja (GET /stores/:id/orders).
class StoreOrderModel {
  const StoreOrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.totalAmount,
    required this.items,
    this.buyerName,
  });

  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final double totalAmount;
  final List<StoreOrderItem> items;
  final String? buyerName;

  String get itemsSummary =>
      items.map((i) => '${i.quantity}x ${i.productName}').join(', ');

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Aguardando pagamento';
      case 'confirmed':
        return 'Pago · aguardando envio';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  }

  factory StoreOrderModel.fromJson(Map<String, dynamic> json) {
    final buyer = json['buyer'] as Map<String, dynamic>?;
    final items = (json['items'] as List<dynamic>? ?? [])
        .map((item) => StoreOrderItem.fromJson(item as Map<String, dynamic>))
        .toList();
    return StoreOrderModel(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      paymentStatus: json['paymentStatus'] as String? ?? 'pending',
      totalAmount: _parseDouble(json['totalAmount']),
      items: items,
      buyerName: buyer?['name'] as String?,
    );
  }
}
