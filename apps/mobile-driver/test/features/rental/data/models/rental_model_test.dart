import 'package:flutter_test/flutter_test.dart';
import 'package:giucar_mobile_driver/features/rental/data/models/rental_model.dart';

void main() {
  group('RentalModel.fromJson', () {
    test('weeklyRate como string "0" (Decimal do Prisma) significa "a definir"',
        () {
      final rental = RentalModel.fromJson({
        'id': 'r1',
        'status': 'requested',
        'weeklyRate': '0',
        'createdAt': '2026-08-15T10:00:00.000Z',
      });

      expect(rental.weeklyRate, 0);
      expect(rental.hasDefinedRate, isFalse);
      expect(rental.isPending, isTrue);
    });

    test('weeklyRate confirmado pelo admin aparece como hasDefinedRate', () {
      final rental = RentalModel.fromJson({
        'id': 'r1',
        'status': 'active',
        'weeklyRate': '150.00',
        'createdAt': '2026-08-15T10:00:00.000Z',
        'startedAt': '2026-08-15T10:05:00.000Z',
      });

      expect(rental.weeklyRate, 150.0);
      expect(rental.hasDefinedRate, isTrue);
      expect(rental.isPending, isFalse);
      expect(rental.startedAt, isNotNull);
    });

    test('RentalStatus.fromBackend mapeia todos os status conhecidos', () {
      const statuses = [
        'requested',
        'active',
        'completed',
        'cancelled',
        'overdue'
      ];
      for (final status in statuses) {
        expect(RentalStatus.fromBackend(status).name, status);
      }
    });

    test('RentalStatus.fromBackend cai pra requested em valor desconhecido',
        () {
      expect(RentalStatus.fromBackend('algo_novo'), RentalStatus.requested);
    });
  });
}
