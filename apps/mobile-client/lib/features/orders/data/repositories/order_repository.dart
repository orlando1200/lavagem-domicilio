    return Order.fromJson(resp.data as Map<String, dynamic>);
  }

  Future<Order> createOrder(CreateOrderRequest request) async {
    final token = await _storage.readAccessToken();
    final body = {
      'items': request.serviceIds.map((id) => {'serviceId': id, 'quantity': 1}).toList(),
      'vehicleId': request.vehicleId,
      'serviceAddressId': request.addressId,
      'paymentMethod': request.paymentMethod,
      'scheduleType': request.scheduledAt != null ? 'scheduled' : 'single',
      if (request.scheduledAt != null)
        'scheduledFor': request.scheduledAt!.toUtc().toIso8601String(),
    };
    final resp = await _dio.post(
      '/orders',
      data: body,
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    return Order.fromJson(resp.data as Map<String, dynamic>);
  }

  Future<void> rateOrder(String orderId, double rating, String? review) async {
    final token = await _storage.readAccessToken();
    );
  }

  Stream<Map<String, dynamic>> connectToOrderStream(String orderId) async* {
    final wsUrl = AppConstants.baseUrl
        .replaceAll('https://', 'wss://')
        .replaceAll('http://', 'ws://');
    _wsChannel = WebSocketChannel.connect(
      Uri.parse(wsUrl),
    );
    _wsChannel!.sink.add(jsonEncode({
      'event': 'join_tracking',
      'data': {'orderId': orderId},
    }));
    await for (final data in _wsChannel!.stream) {
      // Backend sends Socket.IO style messages: { event: '...', data: {...} }
      late final Map<String, dynamic> payload;
      if (data is String) {
        try {
          payload = jsonDecode(data) as Map<String, dynamic>;
        } catch (_) {
          continue;
        }
      } else if (data is Map<String, dynamic>) {
        payload = data;
      } else {
        continue;
      }

      final event = payload['event'] as String?;
      final eventData = payload['data'] as Map<String, dynamic>? ?? payload;

      if (event == 'status_update') {
        yield {'type': 'order_update', 'data': eventData};
      } else if (event == 'location_update') {
        yield {'type': 'driver_location', ...eventData};
      } else if (event == 'eta_update') {
        yield {'type': 'eta_update', ...eventData};
      } else {
        yield payload;
      }
    }
  }

  void disconnectOrderStream() {
    _wsChannel?.sink.close();
