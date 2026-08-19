import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/api/api_exception.dart';
import '../../../auctions/data/driver_profile_repository.dart';
import '../../data/driver_orders_repository.dart';
import '../../data/models/driver_order_model.dart';

export '../../data/models/driver_order_model.dart';

/// Estado completo da area de pedidos do lavador: status online/offline,
/// pedido ativo, ofertas disponiveis e estatisticas do dia.
class DriverOrdersState {
  const DriverOrdersState({
    this.isOnline = false,
    this.isLoadingAvailable = false,
    this.activeOrder,
    this.availableOrders = const [],
    this.errorMessage,
    this.stats = const DriverDailyStats(earningsToday: 0, washesToday: 0, rating: null),
  });

  final bool isOnline;
  final bool isLoadingAvailable;
  final DriverOrder? activeOrder;
  final List<DriverOrder> availableOrders;
  final String? errorMessage;
  final DriverDailyStats stats;

  DriverOrdersState copyWith({
    bool? isOnline,
    bool? isLoadingAvailable,
    DriverOrder? Function()? activeOrder,
    List<DriverOrder>? availableOrders,
    String? Function()? errorMessage,
    DriverDailyStats? stats,
  }) {
    return DriverOrdersState(
      isOnline: isOnline ?? this.isOnline,
      isLoadingAvailable: isLoadingAvailable ?? this.isLoadingAvailable,
      activeOrder: activeOrder != null ? activeOrder() : this.activeOrder,
      availableOrders: availableOrders ?? this.availableOrders,
      errorMessage: errorMessage != null ? errorMessage() : this.errorMessage,
      stats: stats ?? this.stats,
    );
  }
}

/// Provider de pedidos do lavador, conectado ao backend real.
///
/// Online/offline reflete `DriverProfile.status` (`PATCH
/// /driver-profiles/me/availability`); pedidos disponiveis e pedido ativo
/// vem de `GET /orders/available` e `GET /orders/mine/active`; aceitar/
/// avancar status/cancelar chamam os endpoints reais do OrdersModule.
final driverOrdersProvider =
    StateNotifierProvider<DriverOrdersNotifier, DriverOrdersState>((ref) {
  return DriverOrdersNotifier(
    ref.watch(driverOrdersRepositoryProvider),
    ref.watch(driverProfileRepositoryProvider),
  );
});

class DriverOrdersNotifier extends StateNotifier<DriverOrdersState> {
  DriverOrdersNotifier(this._repository, this._profileRepository)
      : super(const DriverOrdersState()) {
    _bootstrap();
  }

  final DriverOrdersRepository _repository;
  final DriverProfileRepository _profileRepository;
  Timer? _locationTimer;

  @override
  void dispose() {
    _locationTimer?.cancel();
    super.dispose();
  }

  /// Liga/desliga o envio periodico de posicao (tracking em tempo
  /// real) conforme ha ou nao um pedido ativo — chamado apos toda
  /// mudanca de `state.activeOrder`. Falha de permissao/GPS e
  /// silenciosa: nunca deve travar o fluxo de pedido do lavador.
  void _syncLocationTracking() {
    final hasActiveOrder = state.activeOrder != null;
    if (hasActiveOrder && _locationTimer == null) {
      _reportLocation();
      _locationTimer = Timer.periodic(const Duration(seconds: 12), (_) => _reportLocation());
    } else if (!hasActiveOrder && _locationTimer != null) {
      _locationTimer?.cancel();
      _locationTimer = null;
    }
  }

  Future<void> _reportLocation() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return;
      }
      if (!await Geolocator.isLocationServiceEnabled()) return;

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      await _profileRepository.updateLocation(
        latitude: position.latitude,
        longitude: position.longitude,
      );
    } catch (_) {
      // Sem GPS/permissao/rede: tenta de novo no proximo tick, nao
      // interrompe o fluxo do pedido.
    }
  }

  /// Carrega o estado inicial ao abrir o app: status online/offline real
  /// do perfil, pedido ativo (se houver) e, se online, a fila de
  /// disponiveis. Falhas de rede aqui mantem o estado local (offline,
  /// sem pedidos) em vez de travar a tela.
  Future<void> _bootstrap() async {
    bool isOnline = false;
    try {
      final profile = await _profileRepository.fetchMyProfile();
      isOnline = profile?.status == 'active';
    } catch (_) {
      // Sem perfil ainda ou erro de rede: comeca offline.
    }
    state = state.copyWith(isOnline: isOnline);
    await _refreshActiveOrder();
    if (isOnline) await _refreshAvailableOrders();
    await _refreshDailyStats();
  }

  Future<void> _refreshDailyStats() async {
    try {
      final stats = await _repository.fetchDailyStats();
      state = state.copyWith(stats: stats);
    } catch (_) {
      // Mantem as estatisticas atuais: falha de rede aqui nao deve travar a tela.
    }
  }

  Future<void> _refreshActiveOrder() async {
    try {
      final order = await _repository.fetchActiveOrder();
      state = state.copyWith(activeOrder: () => order);
      _syncLocationTracking();
    } catch (_) {
      // Mantem o pedido ativo atual: falha de rede aqui nao deve travar a tela.
    }
  }

  Future<void> _refreshAvailableOrders() async {
    state = state.copyWith(isLoadingAvailable: true);
    try {
      final orders = await _repository.fetchAvailableOrders();
      state = state.copyWith(availableOrders: orders, isLoadingAvailable: false);
    } catch (_) {
      state = state.copyWith(isLoadingAvailable: false);
    }
  }

  /// Recarrega manualmente a fila de disponiveis (ex.: pull-to-refresh).
  Future<void> refreshAvailableOrders() => _refreshAvailableOrders();

  /// Alterna online/offline refletindo no backend real. So funciona com o
  /// perfil ja aprovado (`active`/`inactive`) — em `pending_documents` o
  /// backend responde 400 e o motivo aparece em [errorMessage] em vez de
  /// falhar silenciosamente.
  Future<void> toggleOnline() async {
    final goingOnline = !state.isOnline;
    try {
      await _profileRepository.updateAvailability(online: goingOnline);
    } on ApiException catch (e) {
      state = state.copyWith(errorMessage: () => e.message);
      return;
    }
    state = state.copyWith(
      isOnline: goingOnline,
      availableOrders: goingOnline ? state.availableOrders : const [],
    );
    if (goingOnline) await _refreshAvailableOrders();
  }

  /// Limpa a mensagem de erro depois de exibida (SnackBar one-shot).
  void clearError() {
    state = state.copyWith(errorMessage: () => null);
  }

  /// Aceita um pedido disponivel. "Primeiro a aceitar leva": se outro
  /// lavador aceitou primeiro, o backend responde 400 e a lista e
  /// recarregada pra refletir a fila real.
  Future<void> acceptOrder(String orderId) async {
    state = state.copyWith(
      availableOrders: state.availableOrders.where((o) => o.id != orderId).toList(),
    );
    try {
      final updated = await _repository.acceptOrder(orderId);
      state = state.copyWith(activeOrder: () => updated);
      _syncLocationTracking();
    } on ApiException catch (e) {
      state = state.copyWith(errorMessage: () => e.message);
      await _refreshAvailableOrders();
    }
  }

  /// Recusa/remove um pedido disponivel da lista local. Nao existe
  /// endpoint de "recusar" no backend (a fila e so uma leitura de
  /// `searching_washer`) — isso so tira o card da tela deste lavador ate
  /// a proxima atualizacao da lista.
  void rejectOrder(String orderId) {
    state = state.copyWith(
      availableOrders: state.availableOrders.where((o) => o.id != orderId).toList(),
    );
  }

  /// Avanca o status do pedido ativo pro proximo passo do fluxo,
  /// refletindo no backend real e usando a resposta pra manter o estado
  /// local fiel (nao apenas otimista).
  ///
  /// `arrived` e um sub-estado que so existe no app (mesmo `en_route` do
  /// backend que `onTheWay`) — nesse caso avanca localmente sem chamada
  /// de API, pois o backend rejeitaria a "transicao" en_route -> en_route.
  Future<void> advanceActiveOrderStatus() async {
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
    final nextStatus = currentIndex == -1 || currentIndex >= flow.length - 1
        ? DriverOrderStatus.completed
        : flow[currentIndex + 1];

    final nextBackendStatus = nextStatus.backendStatus;
    if (nextBackendStatus == null || nextBackendStatus == active.status.backendStatus) {
      state = state.copyWith(activeOrder: () => active.copyWith(status: nextStatus));
      return;
    }

    try {
      final updated = await _repository.updateStatus(active.id, nextBackendStatus);
      if (updated.status == DriverOrderStatus.completed) {
        state = state.copyWith(activeOrder: () => null);
        await _refreshDailyStats();
        _syncLocationTracking();
      } else {
        state = state.copyWith(activeOrder: () => updated);
      }
    } on ApiException catch (e) {
      state = state.copyWith(errorMessage: () => e.message);
    }
  }

  /// Cancela o pedido ativo (backend real: PATCH /orders/:id/cancel).
  Future<void> cancelActiveOrder() async {
    final active = state.activeOrder;
    if (active == null) return;
    try {
      await _repository.cancel(active.id);
      state = state.copyWith(activeOrder: () => null);
      _syncLocationTracking();
    } on ApiException catch (e) {
      state = state.copyWith(errorMessage: () => e.message);
    }
  }
}
