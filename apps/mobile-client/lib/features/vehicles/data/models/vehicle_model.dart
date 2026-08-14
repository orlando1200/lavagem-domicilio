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

/// Modelo de veiculo do cliente, espelhando `POST/GET /vehicles`.
class VehicleModel {
  const VehicleModel({
    required this.id,
    required this.type,
    required this.brand,
    required this.model,
    required this.plate,
    this.color,
  });

  final String id;
  final VehicleType type;
  final String brand;
  final String model;
  final String? color;
  final String plate;

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: json['id'] as String,
      type: VehicleType.fromBackend(json['type'] as String),
      brand: json['brand'] as String,
      model: json['model'] as String,
      color: json['color'] as String?,
      plate: json['plate'] as String,
    );
  }

  String get displayName => '$brand $model · $plate';
}
