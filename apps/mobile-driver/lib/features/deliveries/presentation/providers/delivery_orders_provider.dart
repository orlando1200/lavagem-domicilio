import 'package:flutter_riverpod/flutter_riverpod.dart';
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
/// Dados mockados localmente: o backend ainda nao expoe um endpoint de
/// entregas de produtos para o lavador. Mantido isolado da area de
/// pedidos de lavagem ([driverOrdersProvider]), pois sao dominios
/// diferentes (servico de lavagem x entrega de produto comprado na loja).
final deliveryOrdersProvider =
    StateNotifierProvider<DeliveryOrdersNotifier, DeliveryOrdersState>((ref) {
  return DeliveryOrdersNotifier();
});

class DeliveryOrdersNotifier extends StateNotifier<DeliveryOrdersState> {
  DeliveryOrdersNotifier()
      : super(
          const DeliveryOrdersState(
            pendingDeliveries: _mockPendingDeliveries,
          ),
        );

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

  /// Aceita uma entrega pendente, tornando-a a entrega ativa do lavador.
  void acceptDelivery(String deliveryId) {
    final delivery = state.pendingDeliveries.firstWhere((d) => d.id == deliveryId);
    state = state.copyWith(
      activeDelivery: () => delivery.copyWith(status: DeliveryOrderStatus.accepted),
      pendingDeliveries:
          state.pendingDeliveries.where((d) => d.id != deliveryId).toList(),
    );
  }

  /// Recusa/remove uma entrega pendente da lista.
  void rejectDelivery(String deliveryId) {
    state = state.copyWith(
      pendingDeliveries:
          state.pendingDeliveries.where((d) => d.id != deliveryId).toList(),
    );
  }

  /// Avanca o status da entrega ativa para a proxima etapa da rota.
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
    state = state.copyWith(
      activeDelivery: () => active.copyWith(status: nextStatus),
    );
  }

  /// Cancela a entrega ativa, retornando ao estado sem entrega em andamento.
  void cancelActiveDelivery() {
    state = state.copyWith(activeDelivery: () => null);
  }
}
