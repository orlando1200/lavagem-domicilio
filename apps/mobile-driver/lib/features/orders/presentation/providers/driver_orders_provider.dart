import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/driver_orders_repository.dart';

/// Status de um pedido do lavador.
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

/// Modelo simples de pedido do lavador (mock local, sem backend real).
class DriverOrder {
  const DriverOrder({
    required this.id,
    required this.status,
    required this.customerName,
    required this.serviceName,
    required this.vehicle,
    required this.address,
    required this.distanceKm,
    required this.etaMinutes,
    required this.price,
  });

  final String id;
  final DriverOrderStatus status;
  final String customerName;
  final String serviceName;
  final String vehicle;
  final String address;
  final double distanceKm;
  final int etaMinutes;
  final double price;

  DriverOrder copyWith({DriverOrderStatus? status}) {
    return DriverOrder(
      id: id,
      status: status ?? this.status,
      customerName: customerName,
      serviceName: serviceName,
      vehicle: vehicle,
      address: address,
      distanceKm: distanceKm,
      etaMinutes: etaMinutes,
      price: price,
    );
  }
}

/// Estatisticas de desempenho do lavador no dia.
class DriverDailyStats {
  const DriverDailyStats({
    required this.earningsToday,
    required this.washesToday,
    required this.rating,
    required this.onlineHours,
  });

  final double earningsToday;
  final int washesToday;
  final double rating;
  final double onlineHours;
}

/// Estado completo da area de pedidos do lavador: status online/offline,
/// pedido ativo, ofertas disponiveis e estatisticas do dia.
class DriverOrdersState {
  const DriverOrdersState({
    this.isOnline = false,
    this.activeOrder,
    this.availableOrders = const [],
    this.stats = const DriverDailyStats(
      earningsToday: 347,
      washesToday: 4,
      rating: 4.9,
      onlineHours: 12,
    ),
  });

  final bool isOnline;
  final DriverOrder? activeOrder;
  final List<DriverOrder> availableOrders;
  final DriverDailyStats stats;

  DriverOrdersState copyWith({
    bool? isOnline,
    DriverOrder? Function()? activeOrder,
    List<DriverOrder>? availableOrders,
    DriverDailyStats? stats,
  }) {
    return DriverOrdersState(
      isOnline: isOnline ?? this.isOnline,
      activeOrder: activeOrder != null ? activeOrder() : this.activeOrder,
      availableOrders: availableOrders ?? this.availableOrders,
      stats: stats ?? this.stats,
    );
  }
}

/// Provider de pedidos do lavador.
///
/// A lista de pedidos disponiveis (`availableOrders`) permanece mockada
/// pois o backend ainda nao expoe um endpoint de listagem de pedidos
/// disponiveis para o lavador (GET /orders e restrito ao role CLIENTE).
/// As acoes de aceitar/avancar status/cancelar chamam o backend real
/// (PATCH /orders/:id/accept, /status, /cancel) via [DriverOrdersRepository];
/// falhas de rede sao silenciadas com o estado local preservado, pois os
/// pedidos mock nao existem de fato no backend.
final driverOrdersProvider =
    StateNotifierProvider<DriverOrdersNotifier, DriverOrdersState>((ref) {
  return DriverOrdersNotifier(ref.watch(driverOrdersRepositoryProvider));
});

class DriverOrdersNotifier extends StateNotifier<DriverOrdersState> {
  DriverOrdersNotifier(this._repository) : super(const DriverOrdersState());

  final DriverOrdersRepository _repository;

  static final List<DriverOrder> _mockAvailableOrders = [
    const DriverOrder(
      id: 'order-1',
      status: DriverOrderStatus.pending,
      customerName: 'Orlando Silva',
      serviceName: 'Lavagem Premium',
      vehicle: 'Honda Civic',
      address: 'Rua Augusta, 150',
      distanceKm: 2.3,
      etaMinutes: 8,
      price: 89.90,
    ),
    const DriverOrder(
      id: 'order-2',
      status: DriverOrderStatus.pending,
      customerName: 'Mariana Costa',
      serviceName: 'Lavagem Express',
      vehicle: 'Toyota Corolla',
      address: 'Av. Paulista, 1000',
      distanceKm: 4.1,
      etaMinutes: 15,
      price: 59.90,
    ),
    const DriverOrder(
      id: 'order-3',
      status: DriverOrderStatus.pending,
      customerName: 'Pedro Lima',
      serviceName: 'Lavagem Detalhada',
      vehicle: 'BMW X3',
      address: 'Alameda Santos, 700',
      distanceKm: 1.8,
      etaMinutes: 6,
      price: 129.90,
    ),
  ];

  /// Alterna o status online/offline do lavador.
  ///
  /// Ao ficar online, popula a lista de pedidos disponiveis com dados mock;
  /// ao ficar offline, limpa a lista (mas preserva o pedido ativo, se houver).
  void toggleOnline() {
    final goingOnline = !state.isOnline;
    state = state.copyWith(
      isOnline: goingOnline,
      availableOrders: goingOnline ? _mockAvailableOrders : const [],
    );
  }

  /// Aceita um pedido disponivel, tornando-o o pedido ativo do lavador.
  ///
  /// Atualiza o estado local imediatamente (UI otimista) e tenta refletir
  /// a acao no backend real via PATCH /orders/:id/accept; erros de rede
  /// (esperados para os ids mock atuais) sao silenciados sem reverter a UI.
  void acceptOrder(String orderId) {
    final order = state.availableOrders.firstWhere((o) => o.id == orderId);
    state = state.copyWith(
      activeOrder: () => order.copyWith(status: DriverOrderStatus.assigned),
      availableOrders:
          state.availableOrders.where((o) => o.id != orderId).toList(),
    );
    _repository.acceptOrder(orderId).catchError((_) {});
  }

  /// Recusa/remove um pedido disponivel da lista.
  void rejectOrder(String orderId) {
    state = state.copyWith(
      availableOrders:
          state.availableOrders.where((o) => o.id != orderId).toList(),
    );
  }

  /// Avanca o status do pedido ativo para a proxima etapa do fluxo.
  ///
  /// Reflete a mudanca no backend real via PATCH /orders/:id/status,
  /// silenciando erros de rede (mesma logica de UI otimista).
  void advanceActiveOrderStatus() {
    final active = state.activeOrder;
    if (active == null) return;

    const flow = [
      DriverOrderStatus.assigned,
      DriverOrderStatus.onTheWay,
      DriverOrderStatus.arrived,
      DriverOrderStatus.inProgress,
      DriverOrderStatus.completed,
    ];
    final currentIndex = flow.indexOf(active.status);
    if (currentIndex == -1 || currentIndex >= flow.length - 1) {
      // Ja concluido: finaliza o pedido e atualiza as estatisticas do dia.
      final backendStatus = DriverOrderStatus.completed.backendStatus;
      if (backendStatus != null) {
        _repository.updateStatus(active.id, backendStatus).catchError((_) {});
      }
      state = state.copyWith(
        activeOrder: () => null,
        stats: DriverDailyStats(
          earningsToday: state.stats.earningsToday + active.price,
          washesToday: state.stats.washesToday + 1,
          rating: state.stats.rating,
          onlineHours: state.stats.onlineHours,
        ),
      );
      return;
    }
    final nextStatus = flow[currentIndex + 1];
    final backendStatus = nextStatus.backendStatus;
    if (backendStatus != null) {
      _repository.updateStatus(active.id, backendStatus).catchError((_) {});
    }
    state = state.copyWith(
      activeOrder: () => active.copyWith(status: nextStatus),
    );
  }

  /// Cancela o pedido ativo, retornando ao estado sem pedido em andamento.
  void cancelActiveOrder() {
    final active = state.activeOrder;
    if (active != null) {
      _repository.cancel(active.id).catchError((_) {});
    }
    state = state.copyWith(activeOrder: () => null);
  }
}
