part 'driver_order_models.freezed.dart';
part 'driver_order_models.g.dart';

enum DriverOrderStatus {
  @JsonValue('pending') pending,
  @JsonValue('assigned') assigned,
  @JsonValue('on_the_way') onTheWay,
  @JsonValue('arrived') arrived,
  @JsonValue('in_progress') inProgress,
  @JsonValue('completed') completed,
  @JsonValue('cancelled') cancelled,
}

extension DriverOrderStatusX on DriverOrderStatus {
  String get label {
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
}

@freezed
