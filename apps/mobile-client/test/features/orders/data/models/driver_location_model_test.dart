import 'package:flutter_test/flutter_test.dart';
import 'package:giucar_mobile_client/features/orders/data/models/driver_location_model.dart';

void main() {
  group('DriverLocation.fromJson', () {
    test('faz parse de latitude/longitude quando vem como string (Decimal do Prisma)', () {
      final location = DriverLocation.fromJson({
        'latitude': '-23.5505',
        'longitude': '-46.6333',
        'updatedAt': '2026-08-15T10:00:00.000Z',
      });

      expect(location.latitude, -23.5505);
      expect(location.longitude, -46.6333);
      expect(location.updatedAt, isNotNull);
    });

    test('faz parse quando vem como numero', () {
      final location = DriverLocation.fromJson({'latitude': -23.55, 'longitude': -46.63});

      expect(location.latitude, -23.55);
      expect(location.longitude, -46.63);
      expect(location.updatedAt, isNull);
    });
  });
}
