/// Tipos de veiculo aceitos pelo backend (enum `VehicleType`).
enum VehicleType {
  carro,
  moto,
  caminhonete,
  van;

  static VehicleType fromBackend(String value) {
    return VehicleType.values.firstWhere(
      (t) => t.name == value,
      orElse: () => VehicleType.carro,
    );
  }

  String get label {
    switch (this) {
      case VehicleType.carro:
        return 'Carro';
      case VehicleType.moto:
        return 'Moto';
      case VehicleType.caminhonete:
        return 'Caminhonete';
      case VehicleType.van:
        return 'Van';
    }
  }
}

/// Tamanho do veiculo pra precificacao da lavagem (Servicos Auto) —
/// dimensao independente de `VehicleType` (um "carro" pode ser
/// Pequeno/Hatch, Medio/Sedan ou Grande/SUV).
enum CarSize {
  PEQUENO,
  MEDIO,
  GRANDE;

  static CarSize? fromBackend(String? value) {
    if (value == null) return null;
    for (final size in CarSize.values) {
      if (size.name == value) return size;
    }
    return null;
  }

  String get label {
    switch (this) {
      case CarSize.PEQUENO:
        return 'Pequeno / Hatch';
      case CarSize.MEDIO:
        return 'Médio / Sedã';
      case CarSize.GRANDE:
        return 'Grande / SUV';
    }
  }
}

/// Modelo de veiculo do cliente, espelhando `POST/GET /vehicles`.
///
/// `catalogYearId`/`catalogBrandName`/`catalogModelName`/`catalogYear` sao
/// opcionais — so existem quando o veiculo foi vinculado ao catalogo
/// estruturado (marca/modelo/ano) no cadastro. Sem eles, a compatibilidade
/// de produtos do marketplace fica sempre `UNKNOWN` (nunca bloqueia).
/// `size` e opcional e alimenta a pre-selecao de tamanho na Lavagem por
/// Tamanho (Servicos Auto) — sem ele, o cliente escolhe manualmente.
class VehicleModel {
  const VehicleModel({
    required this.id,
    required this.type,
    required this.brand,
    required this.model,
    required this.plate,
    this.color,
    this.catalogYearId,
    this.catalogBrandName,
    this.catalogModelName,
    this.catalogYear,
    this.size,
  });

  final String id;
  final VehicleType type;
  final String brand;
  final String model;
  final String? color;
  final String plate;
  final String? catalogYearId;
  final String? catalogBrandName;
  final String? catalogModelName;
  final int? catalogYear;
  final CarSize? size;

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    final catalogYearJson = json['catalogYear'] as Map<String, dynamic>?;
    final catalogModelJson = catalogYearJson?['model'] as Map<String, dynamic>?;
    final catalogBrandJson = catalogModelJson?['brand'] as Map<String, dynamic>?;

    return VehicleModel(
      id: json['id'] as String,
      type: VehicleType.fromBackend(json['type'] as String),
      brand: json['brand'] as String,
      model: json['model'] as String,
      color: json['color'] as String?,
      plate: json['plate'] as String,
      catalogYearId: json['catalogYearId'] as String?,
      catalogBrandName: catalogBrandJson?['name'] as String?,
      catalogModelName: catalogModelJson?['name'] as String?,
      catalogYear: (catalogYearJson?['year'] as num?)?.toInt(),
      size: CarSize.fromBackend(json['size'] as String?),
    );
  }

  String get displayName => '$brand $model · $plate';
}
