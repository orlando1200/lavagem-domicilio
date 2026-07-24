import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_exception.dart';

final driverOrdersRepositoryProvider = Provider<DriverOrdersRepository>((ref) {
  return DriverOrdersRepository(ref.watch(dioProvider));
});

/// Repositorio de acoes de pedido do lavador, conectado ao backend real.
///
/// O backend (OrdersModule) ainda NAO expoe um endpoint de "pedidos
/// disponiveis para aceitar" (GET /orders e restrito ao role CLIENTE).
/// Por isso a listagem de pedidos disponiveis continua mockada em
/// [DriverOrdersNotifier], mas as acoes de aceitar/atualizar status usam
/// os endpoints reais existentes:
///   PATCH /orders/:id/accept
///   PATCH /orders/:id/status  { status, reason? }
class DriverOrdersRepository {
  DriverOrdersRepository(this._dio);

  final Dio _dio;

  Future<void> acceptOrder(String orderId) async {
    try {
      await _dio.patch('/orders/$orderId/accept');
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> updateStatus(String orderId, String backendStatus) async {
    try {
      await _dio.patch('/orders/$orderId/status', data: {'status': backendStatus});
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> cancel(String orderId) async {
    try {
      await _dio.patch('/orders/$orderId/cancel');
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
