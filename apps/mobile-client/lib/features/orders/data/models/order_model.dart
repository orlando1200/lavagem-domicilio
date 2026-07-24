/// Modelo de pedido (Order) espelhando o OrderResponseDto do backend
/// (GET /orders, GET /orders/:id).
class OrderModel {
  const OrderModel({
    required this.id,
    required this.status,
    required this.totalAmount,
    this.scheduledAt,
    this.createdAt,
    this.washerId,
    this.driverId,
  });

  final String id;
  final String status;
  final double totalAmount;
  final DateTime? scheduledAt;
  final DateTime? createdAt;
  final String? washerId;
  final String? driverId;

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'pending',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      scheduledAt: json['scheduledAt'] != null
          ? DateTime.tryParse(json['scheduledAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      washerId: json['washerId'] as String?,
      driverId: json['driverId'] as String?,
    );
  }

  /// Rotulo amigavel para o status vindo do backend
  /// (enum OrderStatus: pending, searching_washer, accepted, en_route,
  /// in_progress, completed, cancelled).
  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'searching_washer':
        return 'Buscando lavador';
      case 'accepted':
        return 'Aceito';
      case 'en_route':
        return 'A caminho';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }
}
