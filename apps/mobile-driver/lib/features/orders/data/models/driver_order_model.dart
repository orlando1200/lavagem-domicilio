double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Status local do pedido do lavador — mais granular que o `OrderStatus`
/// do backend (que nao distingue "a caminho" de "chegou ao local", so
/// tem `en_route` pros dois). `arrived` e uma sub-etapa so de UI, sem
/// persistencia propria no backend.
enum DriverOrderStatus {
  pending,
  assigned,
  onTheWay,
  arrived,
  inProgress,
  completed,
  cancelled,
}

extension DriverOrderStatusX on DriverOrderStatus {
  String get label {
    switch (this) {
      case DriverOrderStatus.pending:
        return 'Novo pedido';
      case DriverOrderStatus.assigned:
        return 'Atribuído';
      case DriverOrderStatus.onTheWay:
        return 'A caminho';
      case DriverOrderStatus.arrived:
        return 'Chegou ao local';
      case DriverOrderStatus.inProgress:
        return 'Em andamento';
      case DriverOrderStatus.completed:
        return 'Concluído';
      case DriverOrderStatus.cancelled:
        return 'Cancelado';
    }
  }

  /// Mapeia o status local para o enum OrderStatus do backend
  /// (pending, searching_washer, accepted, en_route, in_progress,
  /// completed, cancelled), usado nas chamadas PATCH /orders/:id/status.
  String? get backendStatus {
    switch (this) {
      case DriverOrderStatus.assigned:
        return 'accepted';
      case DriverOrderStatus.onTheWay:
        return 'en_route';
      case DriverOrderStatus.arrived:
        return 'en_route';
      case DriverOrderStatus.inProgress:
        return 'in_progress';
      case DriverOrderStatus.completed:
        return 'completed';
      case DriverOrderStatus.cancelled:
        return 'cancelled';
      case DriverOrderStatus.pending:
        return null;
    }
  }
}

DriverOrderStatus _statusFromBackend(String? status) {
  switch (status) {
    case 'accepted':
      return DriverOrderStatus.assigned;
    case 'en_route':
      return DriverOrderStatus.onTheWay;
    case 'in_progress':
      return DriverOrderStatus.inProgress;
    case 'completed':
      return DriverOrderStatus.completed;
    case 'cancelled':
      return DriverOrderStatus.cancelled;
    default:
      return DriverOrderStatus.pending;
  }
}

/// Pedido de lavagem real (GET /orders/available, GET /orders/mine/active),
/// espelhando o `OrderResponseDto`/`ORDER_INCLUDE` do backend.
///
/// Sem rastreamento de geolocalizacao em tempo real do lavador no
/// backend (documentado em `orders.service.ts`) — `distanceKm`/
/// `etaMinutes` nao existem na resposta real, ficam `null` (a UI
/// esconde essas linhas quando nulas, em vez de inventar um numero).
class DriverOrder {
  const DriverOrder({
    required this.id,
    required this.status,
    required this.customerName,
    required this.serviceName,
    required this.vehicle,
    required this.address,
    required this.price,
    this.distanceKm,
    this.etaMinutes,
  });

  final String id;
  final DriverOrderStatus status;
  final String customerName;
  final String serviceName;
  final String vehicle;
  final String address;
  final double price;
  final double? distanceKm;
  final int? etaMinutes;

  DriverOrder copyWith({DriverOrderStatus? status}) {
    return DriverOrder(
      id: id,
      status: status ?? this.status,
      customerName: customerName,
      serviceName: serviceName,
      vehicle: vehicle,
      address: address,
      price: price,
      distanceKm: distanceKm,
      etaMinutes: etaMinutes,
    );
  }

  factory DriverOrder.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'] as Map<String, dynamic>?;
    final vehicleJson = json['vehicle'] as Map<String, dynamic>?;
    final addressJson = json['address'] as Map<String, dynamic>?;
    final items = (json['items'] as List<dynamic>? ?? [])
        .map((item) => (item as Map<String, dynamic>)['name'] as String? ?? '')
        .where((name) => name.isNotEmpty)
        .toList();

    final vehicle = vehicleJson == null
        ? ''
        : '${vehicleJson['brand'] ?? ''} ${vehicleJson['model'] ?? ''}'.trim();
    final address = addressJson == null
        ? ''
        : '${addressJson['street'] ?? ''}, ${addressJson['number'] ?? ''}'.trim();

    return DriverOrder(
      id: json['id'] as String,
      status: _statusFromBackend(json['status'] as String?),
      customerName: customer?['name'] as String? ?? 'Cliente',
      serviceName: items.isEmpty ? 'Lavagem' : items.join(', '),
      vehicle: vehicle,
      address: address,
      price: _parseDouble(json['totalAmount']),
    );
  }
}

/// Estatisticas reais de desempenho do lavador no dia
/// (GET /orders/mine/daily-stats): ganhos e lavagens somados dos
/// pedidos concluidos hoje, avaliacao media do `DriverProfile`.
/// `rating` fica `null` antes do lavador ter qualquer avaliacao — a UI
/// mostra "—" em vez de inventar uma nota.
class DriverDailyStats {
  const DriverDailyStats({
    required this.earningsToday,
    required this.washesToday,
    required this.rating,
  });

  final double earningsToday;
  final int washesToday;
  final double? rating;

  factory DriverDailyStats.fromJson(Map<String, dynamic> json) {
    return DriverDailyStats(
      earningsToday: _parseDouble(json['earningsToday']),
      washesToday: (json['washesToday'] as num?)?.toInt() ?? 0,
      rating: json['rating'] != null ? _parseDouble(json['rating']) : null,
    );
  }
}
