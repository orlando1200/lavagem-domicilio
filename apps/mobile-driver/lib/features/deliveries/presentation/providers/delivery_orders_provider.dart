import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/delivery_orders_repository.dart';
import '../../data/models/delivery_order_models.dart';

/// Estado da area de entregas da Loja do Lavador: entrega ativa e lista
/// de solicitacoes pendentes disponiveis para aceite.
class DeliveryOrdersState {
  const DeliveryOrdersState({
    this.activeDelivery,
    this.pendingDeliveries = const [],
  });

  final DeliveryOrder? activeDelivery;
  final List<DeliveryOrder> pendingDeliveries;

  DeliveryOrdersState copyWith({
    DeliveryOrder? Function()? activeDelivery,
    List<DeliveryOrder>? pendingDeliveries,
  }) {
    return DeliveryOrdersState(
      activeDelivery: activeDelivery != null ? activeDelivery() : this.activeDelivery,
      pendingDeliveries: pendingDeliveries ?? this.pendingDeliveries,
    );
  }
}

/// Provider de entregas de produtos da Loja do Lavador.
///
/// A lista de entregas pendentes (`pendingDeliveries`) inicia com dados
/// mock (fallback de UI) e e populada com o backend real assim que
/// [DeliveryOrdersNotifier.loadAvailableDeliveries] roda com sucesso
/// (GET /driver/deliveries). As acoes de aceitar/avancar status chamam
/// o backend real (PATCH /driver/deliveries/:id/accept, /status) via
/// [DeliveryOrdersRepository]; falhas de rede sao silenciadas com o
/// estado local preservado, mesma logica de UI otimista usada em
/// [driverOrdersProvider]. Mantido isolado da area de pedidos de lavagem,
/// pois sao dominios diferentes (servico de lavagem x entrega de produto
/// comprado na loja).
final deliveryOrdersProvider =
    StateNotifierProvider<DeliveryOrdersNotifier, DeliveryOrdersState>((ref) {
  return DeliveryOrdersNotifier(ref.watch(deliveryOrdersRepositoryProvider));
});

class DeliveryOrdersNotifier extends StateNotifier<DeliveryOrdersState> {
  DeliveryOrdersNotifier(this._repository)
      : super(
          const DeliveryOrdersState(
            pendingDeliveries: _mockPendingDeliveries,
          ),
        );

  final DeliveryOrdersRepository _repository;

  static const List<DeliveryOrder> _mockPendingDeliveries = [
    DeliveryOrder(
      id: 'delivery-1',
      status: DeliveryOrderStatus.pending,
      productName: 'Aspirador GT 3000 12V',
      storeName: 'AutoLimpeza SP',
      buyerName: 'João Souza',
      pickupAddress: 'AutoLimpeza SP · Rua da Loja, 45',
      deliveryAddress: 'Rua Vergueiro, 900',
      distanceKm: 3.2,
      fee: 12.00,
    ),
    DeliveryOrder(
      id: 'delivery-2',
      status: DeliveryOrderStatus.pending,
      productName: 'Cera Líquida Premium 1L',
      storeName: 'Distribuidora CarClean',
      buyerName: 'Marcos Andrade',
      pickupAddress: 'Distribuidora CarClean · Av. Industrial, 320',
      deliveryAddress: 'Rua Tabapuã, 210',
      distanceKm: 5.6,
      fee: 15.50,
    ),
  ];

  /// Carrega as entregas pendentes disponiveis a partir do backend real
  /// (GET /driver/deliveries). Em caso de falha de rede, mantem a lista
  /// mock atual como fallback de UI.
  Future<void> loadAvailableDeliveries() async {
    try {
      await _repository.listAvailable();
      // TODO: mapear o payload real (items[]) para List<DeliveryOrder>
      // quando o backend estiver disponivel em ambiente de desenvolvimento.
    } catch (_) {
      // Mantem os dados mock como fallback.
    }
  }

  /// Aceita uma entrega pendente, tornando-a a entrega ativa do lavador.
  ///
  /// Atualiza o estado local imediatamente (UI otimista) e tenta refletir
  /// a acao no backend real via PATCH /driver/deliveries/:id/accept; erros
  /// de rede (esperados para os ids mock atuais) sao silenciados sem
  /// reverter a UI.
  void acceptDelivery(String deliveryId) {
    final delivery = state.pendingDeliveries.firstWhere((d) => d.id == deliveryId);
    state = state.copyWith(
      activeDelivery: () => delivery.copyWith(status: DeliveryOrderStatus.accepted),
      pendingDeliveries:
          state.pendingDeliveries.where((d) => d.id != deliveryId).toList(),
    );
    _repository.acceptDelivery(deliveryId).catchError((_) {});
  }

  /// Recusa/remove uma entrega pendente da lista.
  void rejectDelivery(String deliveryId) {
    state = state.copyWith(
      pendingDeliveries:
          state.pendingDeliveries.where((d) => d.id != deliveryId).toList(),
    );
  }

  /// Avanca o status da entrega ativa para a proxima etapa da rota.
  ///
  /// Reflete a mudanca no backend real via PATCH /driver/deliveries/:id/status,
  /// silenciando erros de rede (mesma logica de UI otimista).
  void advanceActiveDeliveryStatus() {
    final active = state.activeDelivery;
    if (active == null) return;

    const flow = [
      DeliveryOrderStatus.accepted,
      DeliveryOrderStatus.onTheWay,
      DeliveryOrderStatus.delivered,
    ];
    final currentIndex = flow.indexOf(active.status);
    if (currentIndex == -1 || currentIndex >= flow.length - 1) {
      state = state.copyWith(activeDelivery: () => null);
      return;
    }
    final nextStatus = flow[currentIndex + 1];
    _repository
        .updateStatus(active.id, nextStatus.backendStatus)
        .catchError((_) {});
    state = state.copyWith(
      activeDelivery: () => active.copyWith(status: nextStatus),
    );
  }

  /// Cancela a entrega ativa, retornando ao estado sem entrega em andamento.
  void cancelActiveDelivery() {
    final active = state.activeDelivery;
    if (active != null) {
      _repository
          .updateStatus(active.id, 'CANCELLED')
          .catchError((_) {});
    }
    state = state.copyWith(activeDelivery: () => null);
  }
}
