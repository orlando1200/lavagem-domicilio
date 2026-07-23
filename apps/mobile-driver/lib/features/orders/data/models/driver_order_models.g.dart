Map<String, dynamic> _$$DriverOrderClientImplToJson(_$DriverOrderClientImpl i) =>
    {'id': i.id, 'name': i.name, 'phone': i.phone, 'photoUrl': i.photoUrl};

_$DriverOrderImpl _$$DriverOrderImplFromJson(Map<String, dynamic> json) =>
    _$DriverOrderImpl(
      id: json['id'] as String,
      status: _decodeDriverOrderStatus(json['status'] as String),
      services: (json['services'] as List<dynamic>).map((e) => DriverOrderService.fromJson(e as Map<String, dynamic>)).toList(),
      total: (json['total'] as num).toDouble(),
      serviceLocation: DriverOrderLocation.fromJson(json['serviceLocation'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),






































  'completedAt': i.completedAt?.toIso8601String(), 'distanceKm': i.distanceKm, 'estimatedMinutes': i.estimatedMinutes,
};

const _$DriverOrderStatusEnumMap = {
  DriverOrderStatus.pending: 'pending',
  DriverOrderStatus.assigned: 'assigned',
  DriverOrderStatus.onTheWay: 'on_the_way',
  DriverOrderStatus.arrived: 'arrived',
  DriverOrderStatus.inProgress: 'in_progress',
  DriverOrderStatus.completed: 'completed',
  DriverOrderStatus.cancelled: 'cancelled',
};

_$DriverChatMessageImpl _$$DriverChatMessageImplFromJson(Map<String, dynamic> json) =>
    _$DriverChatMessageImpl(id: json['id'] as String, orderId: json['orderId'] as String, senderId: json['senderId'] as String, senderName: json['senderName'] as String, message: json['message'] as String, sentAt: DateTime.parse(json['sentAt'] as String), isFromClient: json['isFromClient'] as bool? ?? false);
    case 'pending':
    case 'pending_dispatch':
      return DriverOrderStatus.pending;
    case 'assigned':
    case 'driver_assigned':
      return DriverOrderStatus.assigned;
    case 'on_the_way':
    case 'driver_arriving':
      return DriverOrderStatus.onTheWay;
    case 'arrived':
      return DriverOrderStatus.arrived;
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

_$DriverChatMessageImpl _$$DriverChatMessageImplFromJson(Map<String, dynamic> json) =>
    _$DriverChatMessageImpl(id: json['id'] as String, orderId: json['orderId'] as String, senderId: json['senderId'] as String, senderName: json['senderName'] as String, message: json['message'] as String, sentAt: DateTime.parse(json['sentAt'] as String), isFromClient: json['isFromClient'] as bool? ?? false);
