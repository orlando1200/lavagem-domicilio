import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../../core/infrastructure/api_client.dart';
import '../../../../core/infrastructure/secure_storage_service.dart';
import '../../../../core/constants/app_constants.dart';
import '../models/driver_order_models.dart';

final driverOrderRepositoryProvider = Provider<DriverOrderRepository>((ref) {
  return DriverOrderRepository(
    ref.read(dioProvider),
    ref.read(driverSecureStorageProvider),
  );
});

class DriverOrderRepository {
  DriverOrderRepository(this._dio, this._storage);

  final Dio _dio;
  final DriverSecureStorageService _storage;
  WebSocketChannel? _wsChannel;

  Future<List<DriverOrder>> getAvailableOrders() async {
    final token = await _storage.readAccessToken();
    final resp = await _dio.get(
      '/driver/orders/available',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    final list = resp.data as List;
    return list.map((e) => DriverOrder.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<DriverOrder>> getMyOrders({String? status}) async {
    final token = await _storage.readAccessToken();
    final resp = await _dio.get(
      '/driver/orders',
      queryParameters: status != null ? {'status': status} : null,
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    final list = resp.data as List;
    return list.map((e) => DriverOrder.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<DriverOrder> acceptOrder(String orderId) async {
    final token = await _storage.readAccessToken();
    final resp = await _dio.post(
      '/driver/orders/$orderId/accept',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    return DriverOrder.fromJson(resp.data as Map<String, dynamic>);
  }

  Future<void> rejectOrder(String orderId) async {
    final token = await _storage.readAccessToken();
    await _dio.post(
      '/driver/orders/$orderId/reject',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }

  Future<DriverOrder> updateOrderStatus(String orderId, String status) async {
    final token = await _storage.readAccessToken();
    final resp = await _dio.post(
      '/driver/orders/$orderId/status',
      data: {'status': status},
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    return DriverOrder.fromJson(resp.data as Map<String, dynamic>);
  }

  Future<DriverOrder> completeOrder(String orderId) async {
    return updateOrderStatus(orderId, 'completed');
  }

  Future<void> updateLocation(double lat, double lng) async {
    final token = await _storage.readAccessToken();
    await _dio.post(
      '/tracking/drivers/location',
      data: {'latitude': lat, 'longitude': lng},
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }

  Stream<Map<String, dynamic>> connectDriverSocket(String driverId) async* {
    final wsUrl = DriverAppConstants.baseUrl
        .replaceAll('https://', 'wss://')
        .replaceAll('http://', 'ws://');
    _wsChannel = WebSocketChannel.connect(
      Uri.parse('$wsUrl/tracking'),
    );
    _wsChannel!.sink.add(jsonEncode({
      'event': 'join_driver',
      'data': {'driverId': driverId},
    }));
    await for (final data in _wsChannel!.stream) {
      final decoded = jsonDecode(data as String) as Map<String, dynamic>;
      yield decoded;
    }
  }

  void sendWsMessage(Map<String, dynamic> message) {
    _wsChannel?.sink.add(jsonEncode(message));
  }

  void disconnectSocket() {
    _wsChannel?.sink.close();
    _wsChannel = null;
  }

  Future<String> uploadPhoto(String orderId, String type, String filePath) async {
    final token = await _storage.readAccessToken();
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
      'photoType': type,
    });
    final resp = await _dio.post(
      '/orders/$orderId/photos',
      data: formData,
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    return resp.data['url'] as String;
  }

  DriverOrder mockPendingOrder() {
    return DriverOrder(
      id: 'mock-order-id',
      status: DriverOrderStatus.pending,
      services: const [
        DriverOrderService(id: 'svc-1', name: 'Lavagem externa', price: 49.9),
      ],
      total: 49.9,
      serviceLocation: const DriverOrderLocation(lat: -23.55, lng: -46.63, address: 'Av. Paulista, 1000'),
      createdAt: DateTime.now(),
      client: const DriverOrderClient(id: 'client-1', name: 'Cliente Teste'),
    );
  }
}

    final token = await _storage.readAccessToken();
    await _dio.post(
      '/orders/$orderId/chat',
      data: {'message': message},
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }

  DriverOrder mockPendingOrder() {
    return DriverOrder(
      id: 'mock-order-id',
      status: DriverOrderStatus.pending,
      ),
    );

    await _dio.post(
      '/orders/$orderId/photos/save',
      data: {
        'storageKey': storageKey,
        'mimeType': mimeType,
        'sizeBytes': sizeBytes,
        'photoType': type,
      },
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );

    return storageKey;
  }

  String _mimeTypeFromName(String name) {
    final ext = name.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  Future<List<DriverChatMessage>> getChatMessages(String orderId) async {
    final token = await _storage.readAccessToken();
