part 'order_models.freezed.dart';
part 'order_models.g.dart';

enum OrderStatus {
  @JsonValue('pending') pending,
  @JsonValue('confirmed') confirmed,
  @JsonValue('assigned') assigned,
  @JsonValue('on_the_way') onTheWay,
  @JsonValue('arrived') arrived,
  @JsonValue('in_progress') inProgress,
  @JsonValue('completed') completed,
  @JsonValue('cancelled') cancelled,
}

extension OrderStatusX on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.pending:
        return 'Aguardando';
      case OrderStatus.confirmed:
        return 'Confirmado';
      case OrderStatus.assigned:
        return 'Lavador atribuído';
      case OrderStatus.onTheWay:
        return 'Lavador a caminho';
      case OrderStatus.arrived:
        return 'Chegou ao local';
      case OrderStatus.inProgress:
        return 'Em andamento';
      case OrderStatus.completed:
        return 'Concluído';
      case OrderStatus.cancelled:
        return 'Cancelado';
    }
  }

  bool get isActive =>
      this == OrderStatus.assigned ||
      this == OrderStatus.onTheWay ||
      this == OrderStatus.arrived ||
      this == OrderStatus.inProgress;
}

@freezed
class OrderLocation with _$OrderLocation {











































































      _$ChatMessageFromJson(json);
}

@freezed
class CreateOrderItem with _$CreateOrderItem {
  const factory CreateOrderItem({
    required String serviceId,
    @Default(1) int quantity,
  }) = _CreateOrderItem;

  factory CreateOrderItem.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderItemFromJson(json);
}

@freezed
class CreateOrderRequest with _$CreateOrderRequest {
  const factory CreateOrderRequest({
    required List<CreateOrderItem> items,
    required String vehicleId,
    required String serviceAddressId,
    required String paymentMethod,
    @Default('single') String scheduleType,
    DateTime? scheduledAt,
    String? customerNotes,
  }) = _CreateOrderRequest;

  factory CreateOrderRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderRequestFromJson(json);
}

