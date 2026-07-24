/// Status de uma entrega de produto da Loja do Lavador.
enum DeliveryOrderStatus {
  pending,
  accepted,
  onTheWay,
  delivered,
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
/// coleta na loja/parceiro e entrega ao comprador. A lista disponivel e
/// mockada localmente como fallback, mas as acoes (aceitar/avancar
/// status) chamam o backend real (`DeliveryOrdersRepository`) quando o
/// id da entrega existir de fato no servidor.
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
