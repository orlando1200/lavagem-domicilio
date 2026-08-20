/// Resultado de `GET /vehicles/lookup-plate/:plate` (modo simulado —
/// ver PlateLookupGateway no backend). `null` nos campos e normal: o
/// provedor real nem sempre retorna todos os dados.
class PlateLookupResult {
  const PlateLookupResult({
    required this.brand,
    required this.model,
    this.modelYear,
    this.manufactureYear,
    this.color,
    this.fuelType,
  });

  final String brand;
  final String model;
  final int? modelYear;
  final int? manufactureYear;
  final String? color;
  final String? fuelType;

  factory PlateLookupResult.fromJson(Map<String, dynamic> json) {
    return PlateLookupResult(
      brand: json['brand'] as String,
      model: json['model'] as String,
      modelYear: (json['modelYear'] as num?)?.toInt(),
      manufactureYear: (json['manufactureYear'] as num?)?.toInt(),
      color: json['color'] as String?,
      fuelType: json['fuelType'] as String?,
    );
  }

  /// Rotulo de ano pra exibicao: "modelo/fabricacao" quando os dois
  /// existem e diferem, senao so um deles, senao nada.
  String? get yearLabel {
    if (modelYear != null && manufactureYear != null && modelYear != manufactureYear) {
      return '$manufactureYear/$modelYear';
    }
    return (modelYear ?? manufactureYear)?.toString();
  }
}
