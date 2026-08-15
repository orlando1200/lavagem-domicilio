import 'package:flutter_test/flutter_test.dart';
import 'package:giucar_mobile_lojista/features/orders/data/models/store_order_model.dart';

void main() {
  group('StoreOrderModel.fromJson', () {
    test('faz parse de totalAmount e items com valores em Decimal-string', () {
      final order = StoreOrderModel.fromJson({
        'id': 'o1',
        'orderNumber': 'PED-001',
        'status': 'confirmed',
        'paymentStatus': 'paid',
        'totalAmount': '99.90',
        'buyer': {'name': 'Cliente Teste'},
        'items': [
          {
            'quantity': 2,
            'totalPrice': '59.80',
            'product': {'name': 'Shampoo Automotivo'},
          },
        ],
      });

      expect(order.totalAmount, 99.9);
      expect(order.buyerName, 'Cliente Teste');
      expect(order.items, hasLength(1));
      expect(order.items.first.totalPrice, 59.8);
      expect(order.items.first.quantity, 2);
      expect(order.itemsSummary, '2x Shampoo Automotivo');
    });

    test('statusLabel traduz todos os status conhecidos do backend', () {
      const expected = {
        'pending': 'Aguardando pagamento',
        'confirmed': 'Pago · aguardando envio',
        'shipped': 'Enviado',
        'delivered': 'Entregue',
        'cancelled': 'Cancelado',
        'refunded': 'Reembolsado',
      };

      for (final entry in expected.entries) {
        final order = StoreOrderModel.fromJson({
          'id': 'o1',
          'orderNumber': 'PED-001',
          'status': entry.key,
          'paymentStatus': 'pending',
          'totalAmount': '10',
          'items': [],
        });
        expect(order.statusLabel, entry.value, reason: 'status: ${entry.key}');
      }
    });
  });
}
