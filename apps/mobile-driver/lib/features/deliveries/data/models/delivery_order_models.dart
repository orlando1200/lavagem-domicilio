/// Status de uma entrega de produto da Loja do Lavador.
enum DeliveryOrderStatus {
  pending,
  accepted,
  onTheWay,
  delivered,
}

/// Decimal do Prisma serializa como string no JSON (ex.: "49.90"), nao
/// como numero — parse defensivo que aceita os dois formatos.
double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

DeliveryOrderStatus _statusFromBackend(String? value) {
  switch (value) {
    case 'ACCEPTED':
      return DeliveryOrderStatus.accepted;
    case 'ON_THE_WAY':
      return DeliveryOrderStatus.onTheWay;
    case 'DELIVERED':
      return DeliveryOrderStatus.delivered;
    case 'PENDING':
    default:
      return DeliveryOrderStatus.pending;
  }
}

extension DeliveryOrderStatusX on DeliveryOrderStatus {
  String get label {
    switch (this) {
      case DeliveryOrderStatus.pending:
        return 'Aguardando aceite';
      case DeliveryOrderStatus.accepted:
        return 'Aceita';
      case DeliveryOrderStatus.onTheWay:
        return 'Em rota';
      case DeliveryOrderStatus.delivered:
        return 'Entregue';
    }
  }

  /// Mapeia o status local para o enum `ProductOrderDeliveryStatus` do
  /// backend (PENDING, ACCEPTED, ON_THE_WAY, DELIVERED), usado nas
  /// chamadas PATCH /driver/deliveries/:id/status.
  String get backendStatus {
    switch (this) {
      case DeliveryOrderStatus.pending:
        return 'PENDING';
      case DeliveryOrderStatus.accepted:
        return 'ACCEPTED';
      case DeliveryOrderStatus.onTheWay:
        return 'ON_THE_WAY';
      case DeliveryOrderStatus.delivered:
        return 'DELIVERED';
    }
  }
}

/// Modelo simples de entrega de produto comprado na Loja do Lavador.
///
/// Fluxo: o lavador recebe a solicitacao de entrega de um produto
/// comprado por outro lavador na Loja do Lavador, aceita, faz a rota de
/// coleta na loja/parceiro e entrega ao comprador. A lista disponivel
/// (`GET /driver/deliveries`) e as acoes (aceitar/avancar status) sao
/// todas conectadas ao backend real via `DeliveryOrdersRepository`.
class DeliveryOrder {
  const DeliveryOrder({
    required this.id,
    required this.status,
    required this.productName,
    required this.storeName,
    required this.buyerName,
    required this.pickupAddress,
    required this.deliveryAddress,
    required this.distanceKm,
    required this.fee,
  });

  final String id;
  final DeliveryOrderStatus status;
  final String productName;
  final String storeName;
  final String buyerName;
  final String pickupAddress;
  final String deliveryAddress;
  final double distanceKm;
  final double fee;

  /// Faz o parse do `ProductOrder` real devolvido por
  /// `GET /driver/deliveries` (`{ items: ProductOrder[] }`). Nao ha campo
  /// de distancia no backend hoje — fica fixo em 0.0, so decorativo.
  factory DeliveryOrder.fromJson(Map<String, dynamic> json) {
    final items = json['items'] as List<dynamic>? ?? const [];
    final firstProduct = items.isNotEmpty
        ? (items.first as Map<String, dynamic>)['product'] as Map<String, dynamic>?
        : null;
    final store = json['store'] as Map<String, dynamic>?;
    final buyer = json['buyer'] as Map<String, dynamic>?;
    final shippingAddress = json['shippingAddress'] as Map<String, dynamic>?;

    return DeliveryOrder(
      id: json['id'] as String,
      status: _statusFromBackend(json['deliveryStatus'] as String?),
      productName: firstProduct?['name'] as String? ?? 'Produto',
      storeName: store?['name'] as String? ?? 'Loja',
      buyerName: buyer?['name'] as String? ?? 'Cliente',
      pickupAddress: store?['name'] as String? ?? '',
      deliveryAddress: shippingAddress == null
          ? ''
          : '${shippingAddress['street'] ?? ''}, ${shippingAddress['number'] ?? ''}',
      distanceKm: 0.0,
      fee: _parseDouble(json['shippingAmount']),
    );
  }

  DeliveryOrder copyWith({DeliveryOrderStatus? status}) {
    return DeliveryOrder(
      id: id,
      status: status ?? this.status,
      productName: productName,
      storeName: storeName,
      buyerName: buyerName,
      pickupAddress: pickupAddress,
      deliveryAddress: deliveryAddress,
      distanceKm: distanceKm,
      fee: fee,
    );
  }
}
