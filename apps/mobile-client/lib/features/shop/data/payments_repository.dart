import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/payment_intent_model.dart';
import 'models/payment_model.dart';

final paymentsRepositoryProvider = Provider<PaymentsRepository>((ref) {
  return PaymentsRepository(ref.watch(dioProvider));
});

/// Repositorio de pagamentos (modulo `payments`). Usado aqui para
/// pagar pedidos de produto (`productOrderId`) apos o checkout.
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

  /// Modo mock: nao ha gateway de pagamento real configurado (sem
  /// chaves de sandbox do Mercado Pago — ver
  /// `services/api/src/modules/payments/adapters/mercado-pago.adapter.ts`
  /// e a tabela "Modo mock" em `docs/PROGRESSO.md`). `POST
  /// /payments/webhook` e propositalmente sem autenticacao — e o
  /// endpoint que um gateway real chamaria; em modo mock, o proprio
  /// app simula essa confirmacao para exercitar o pipeline completo
  /// (intent -> webhook -> paymentStatus=paid).
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

  /// Consulta o pagamento existente de um pedido de lavagem
  /// (GET /payments/orders/:orderId). Devolve `null` quando ainda nao
  /// existe pagamento (404) em vez de propagar erro — e um estado
  /// esperado (pedido criado mas ainda nao pago), nao uma falha.
  Future<PaymentModel?> fetchForOrder(String orderId) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/payments/orders/$orderId');
      return PaymentModel.fromJson(response.data!);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      throw ApiException.fromDioException(e);
    }
  }
}
