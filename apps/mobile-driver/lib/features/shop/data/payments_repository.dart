import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/payment_intent_model.dart';

final paymentsRepositoryProvider = Provider<PaymentsRepository>((ref) {
  return PaymentsRepository(ref.watch(dioProvider));
});

/// Repositorio de pagamentos (modulo `payments`). Usado aqui para
/// pagar pedidos de produto (`productOrderId`) apos o checkout da
/// Loja de Produtos.
class PaymentsRepository {
  PaymentsRepository(this._dio);

  final Dio _dio;

  Future<PaymentIntentModel> createIntent({
    String? orderId,
    String? productOrderId,
    required String method,
  }) async {
    try {
      final response =
          await _dio.post<Map<String, dynamic>>('/payments/intent', data: {
        if (orderId != null) 'orderId': orderId,
        if (productOrderId != null) 'productOrderId': productOrderId,
        'method': method,
      });
      return PaymentIntentModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Modo mock: sem gateway de pagamento real configurado — mesma
  /// pragmatica ja usada no app cliente (ver `docs/PROGRESSO.md`,
  /// tabela "Modo mock"). `POST /payments/webhook` e propositalmente
  /// sem autenticacao — e o endpoint que um gateway real chamaria.
  Future<void> confirmMock(String externalRef) async {
    try {
      await _dio.post<void>('/payments/webhook', data: {
        'externalRef': externalRef,
        'status': 'approved',
      });
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
