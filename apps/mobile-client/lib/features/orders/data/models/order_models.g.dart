      'description': instance.description,
    };

_$OrderImpl _$$OrderImplFromJson(Map<String, dynamic> json) => _$OrderImpl(
      id: json['id'] as String,
      status: _decodeOrderStatus(json['status'] as String),
      items: (json['items'] as List<dynamic>)
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toDouble(),
      serviceLocation: OrderLocation.fromJson(
          json['serviceLocation'] as Map<String, dynamic>),






































      'clientReview': instance.clientReview,
    };

const _$OrderStatusEnumMap = {
  OrderStatus.pending: 'pending',
  OrderStatus.searchingDriver: 'searching_driver',
  OrderStatus.driverAccepted: 'driver_accepted',
  OrderStatus.driverOnWay: 'driver_on_way',
  OrderStatus.inProgress: 'in_progress',
  OrderStatus.completed: 'completed',
  OrderStatus.cancelled: 'cancelled',
};

OrderStatus _decodeOrderStatus(String value) {
  switch (value) {
    case 'pending':
    case 'confirmed':
      return OrderStatus.pending;
    case 'assigned':
      return OrderStatus.searchingDriver;
    case 'on_the_way':
      return OrderStatus.driverOnWay;
    case 'arrived':
      return OrderStatus.driverOnWay;
    case 'in_progress':
      return OrderStatus.inProgress;
    case 'completed':
      return OrderStatus.completed;
    case 'cancelled':
      return OrderStatus.cancelled;
    default:
      return OrderStatus.pending;
  }
}

_$ChatMessageImpl _$$ChatMessageImplFromJson(Map<String, dynamic> json) =>
    _$ChatMessageImpl(
