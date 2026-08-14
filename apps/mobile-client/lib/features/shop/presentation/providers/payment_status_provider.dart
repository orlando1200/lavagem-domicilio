import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/payment_model.dart';
import '../../data/payments_repository.dart';

/// FutureProvider.family.autoDispose para o pagamento (se existir) de
/// um pedido de lavagem especifico — usado na tela de detalhe do
/// pedido pra decidir entre "Pagar agora"/"Retomar pagamento"/pago.
final paymentForOrderProvider =
    FutureProvider.family.autoDispose<PaymentModel?, String>((ref, orderId) {
  return ref.watch(paymentsRepositoryProvider).fetchForOrder(orderId);
});
