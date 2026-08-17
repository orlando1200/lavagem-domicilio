double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Posicao atual do lavador atribuido a um pedido (GET
/// /orders/:id/driver-location) — usado no mapa de acompanhamento.
class DriverLocation {
  const DriverLocation({required this.latitude, required this.longitude, this.updatedAt});

  final double latitude;
  final double longitude;
  final DateTime? updatedAt;

  factory DriverLocation.fromJson(Map<String, dynamic> json) {
    return DriverLocation(
      latitude: _parseDouble(json['latitude']),
      longitude: _parseDouble(json['longitude']),
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'] as String) : null,
    );
  }
}
