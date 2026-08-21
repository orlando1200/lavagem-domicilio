import '../../../vehicles/data/models/vehicle_model.dart';

// Tipo de lavagem oferecido em Servicos Auto — substitui DRY_WASH/EXPRESS_WASH
// (preco unico por tipo) por preco variando por tamanho do veiculo.
enum WashType {
  SECO,
  EXPRESSA,
  COMPLETA,
  HIGIENIZACAO_INTERNA,
  POLIMENTO;

  static WashType? fromBackend(String? value) {
    if (value == null) return null;
    for (final type in WashType.values) {
      if (type.name == value) return type;
    }
    return null;
  }

  String get label {
    switch (this) {
      case WashType.SECO:
        return 'Seco';
      case WashType.EXPRESSA:
        return 'Expressa';
      case WashType.COMPLETA:
        return 'Completa';
      case WashType.HIGIENIZACAO_INTERNA:
        return 'Higienização interna';
      case WashType.POLIMENTO:
        return 'Polimento';
    }
  }
}

/// Decimal do Prisma serializa como string no JSON — parse defensivo.
double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Uma combinacao ativa da matriz de precos (GET /wash-pricing/matrix).
class WashPriceEntry {
  const WashPriceEntry({required this.carSize, required this.washType, required this.price});

  final CarSize carSize;
  final WashType washType;
  final double price;

  factory WashPriceEntry.fromJson(Map<String, dynamic> json) {
    return WashPriceEntry(
      carSize: CarSize.fromBackend(json['carSize'] as String?)!,
      washType: WashType.fromBackend(json['washType'] as String?)!,
      price: _parseDouble(json['price']),
    );
  }
}
