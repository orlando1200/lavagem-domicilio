  StreamSubscription<Map<String, dynamic>>? _sub;
  Timer? _locationTimer;

  void connect(String driverId) {
    if (state.isConnected) return;
    final stream = _repo.connectDriverSocket(driverId);
    _sub = stream.listen(_handleEvent);
    _startPollingAvailableOrders();
    state = state.copyWith(isConnected: true);
    _startLocationUpdates();
  }

  void disconnect() {
    _sub?.cancel();
    _locationTimer?.cancel();
    _pollingTimer?.cancel();
    _repo.disconnectSocket();
    state = const DriverSocketState();
  }

  Timer? _pollingTimer;

  void _startPollingAvailableOrders() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        if (state.pendingOrder != null) return;
        final orders = await _repo.getAvailableOrders();
        if (orders.isNotEmpty) {
          state = state.copyWith(pendingOrder: () => orders.first);
        }
      } catch (_) {}
    });
  }

  void _handleEvent(Map<String, dynamic> event) {
    final type = event['type'] as String?;
    if (type == 'new_order') {
      final order = DriverOrder.fromJson(event['data'] as Map<String, dynamic>);
      // Backend emits an offer with attemptId/orderId; fetch full order details
      final orderId = data['orderId'] as String?;
      if (orderId == null) return;
      _fetchAndSetPendingOrder(orderId);
    } else if (type == 'order_cancelled') {
      state = state.copyWith(
        pendingOrder: () => null,
        activeOrder: () {
          final active = state.activeOrder;
          if (active?.id == event['orderId']) return null;
          return active;
        },
      );
    }
  }

  Future<void> _fetchAndSetPendingOrder(String orderId) async {
    try {
      final orders = await _repo.getAvailableOrders();
      final order = orders.firstWhere((o) => o.id == orderId);
      state = state.copyWith(pendingOrder: () => order);
    } catch (_) {}
  }

  void clearPendingOrder() {
    state = state.copyWith(activeOrder: () => null);
  }

  void _startLocationUpdates() {
    _locationTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        final activeOrder = state.activeOrder;
        if (activeOrder != null) {
          await _repo.updateLocation(activeOrder.id, pos.latitude, pos.longitude);
        }
        _repo.sendWsMessage({
          'type': 'location_update',
          'lat': pos.latitude,
          'lng': pos.longitude,
        });
      } catch (_) {}
    });
  }
}

// ── Driver orders list ────────────────────────────────────────────────────────

  Future<void> rejectOrder(String orderId) async {
    await ref.read(driverOrderRepositoryProvider).rejectOrder(orderId);
    ref.read(driverSocketProvider.notifier).clearPendingOrder();
  }

  Future<DriverOrder?> completeOrder(String orderId) async {
    try {
