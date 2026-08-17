import 'package:flutter_test/flutter_test.dart';
import 'package:giucar_mobile_client/features/orders/data/models/order_model.dart';

void main() {
  group('OrderModel.fromJson', () {
    test('faz parse de totalAmount quando vem como string (Decimal do Prisma)',
        () {
      // Backend real serializa Decimal como string ("80", nao 80) — cast
      // direto `as num?` quebra com TypeError nesse caso (bug real desta
      // sessao: essa era a serializacao real de GET/POST /orders e o
      // model antigo lancava excecao ao tentar exibir qualquer pedido).
      final order = OrderModel.fromJson({
        'id': 'order-1',
        'status': 'searching_washer',
        'totalAmount': '80',
      });

      expect(order.totalAmount, 80.0);
    });

    test('faz parse de totalAmount quando vem como numero', () {
      final order = OrderModel.fromJson({
        'id': 'order-1',
        'status': 'pending',
        'totalAmount': 45.5,
      });

      expect(order.totalAmount, 45.5);
    });

    test('usa fallback de status/totalAmount quando ausentes', () {
      final order = OrderModel.fromJson({'id': 'order-1'});

      expect(order.status, 'pending');
      expect(order.totalAmount, 0);
    });

    test('faz parse de datas opcionais', () {
      final order = OrderModel.fromJson({
        'id': 'order-1',
        'status': 'completed',
        'totalAmount': '120.00',
        'createdAt': '2026-08-15T10:00:00.000Z',
        'scheduledAt': null,
      });

      expect(order.createdAt, isNotNull);
      expect(order.scheduledAt, isNull);
    });

    test('statusLabel traduz todos os status conhecidos do backend', () {
      const expected = {
        'pending': 'Pendente',
        'searching_washer': 'Buscando lavador',
        'accepted': 'Aceito',
        'en_route': 'A caminho',
        'in_progress': 'Em andamento',
        'completed': 'Concluído',
        'cancelled': 'Cancelado',
      };

      for (final entry in expected.entries) {
        final order = OrderModel.fromJson({
          'id': 'x',
          'status': entry.key,
          'totalAmount': '0',
        });
        expect(order.statusLabel, entry.value, reason: 'status: ${entry.key}');
      }
    });

    test('faz parse das coordenadas do endereco aninhado', () {
      final order = OrderModel.fromJson({
        'id': 'order-1',
        'status': 'accepted',
        'totalAmount': '80',
        'driverId': 'driver-1',
        'address': {'latitude': '-23.5505', 'longitude': '-46.6333'},
      });

      expect(order.addressLatitude, -23.5505);
      expect(order.addressLongitude, -46.6333);
    });

    test('addressLatitude/Longitude ficam null sem endereco no JSON', () {
      final order = OrderModel.fromJson({
        'id': 'order-1',
        'status': 'pending',
        'totalAmount': '0',
      });

      expect(order.addressLatitude, isNull);
      expect(order.addressLongitude, isNull);
    });

    group('isTrackable', () {
      test('true quando ha driverId e status em etapa rastreavel', () {
        for (final status in ['accepted', 'en_route', 'in_progress']) {
          final order = OrderModel.fromJson({
            'id': 'x',
            'status': status,
            'totalAmount': '0',
            'driverId': 'driver-1',
          });
          expect(order.isTrackable, isTrue, reason: 'status: $status');
        }
      });

      test('false sem driverId mesmo com status rastreavel', () {
        final order = OrderModel.fromJson({
          'id': 'x',
          'status': 'accepted',
          'totalAmount': '0',
        });
        expect(order.isTrackable, isFalse);
      });

      test('false em etapas nao rastreaveis mesmo com driverId', () {
        for (final status in ['pending', 'searching_washer', 'completed', 'cancelled']) {
          final order = OrderModel.fromJson({
            'id': 'x',
            'status': status,
            'totalAmount': '0',
            'driverId': 'driver-1',
          });
          expect(order.isTrackable, isFalse, reason: 'status: $status');
        }
      });
    });
  });
}
