List<String> _parseStringList(dynamic value) {
  if (value is! List) return const [];
  return value.map((e) => e.toString()).toList();
}

double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Zona de cobertura (`Zone`) — versao enxuta usada dentro do perfil
/// do lavador (nao a listagem administrativa completa).
class ZoneSummary {
  const ZoneSummary({
    required this.id,
    required this.name,
    required this.city,
    required this.state,
  });

  final String id;
  final String name;
  final String city;
  final String state;

  factory ZoneSummary.fromJson(Map<String, dynamic> json) {
    return ZoneSummary(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
    );
  }
}

/// Perfil de motorista/loja (`DriverProfile`), espelhando o retorno do
/// backend (modulo `drivers`, `POST/GET/PATCH /driver-profiles/me`).
/// Precisa ter `driverType = CARWASH_SHOP`, `HEAVY_SERVICE` em
/// `allowedServices` e `status = active` para participar de leiloes.
class DriverProfileModel {
  const DriverProfileModel({
    required this.driverType,
    required this.allowedServices,
    required this.status,
    required this.serviceRadiusKm,
    this.zone,
    this.pixKeyType,
    this.pixKey,
    this.bankName,
    this.agency,
    this.accountNumber,
  });

  final String driverType;
  final List<String> allowedServices;
  final String status;
  final double serviceRadiusKm;
  final ZoneSummary? zone;
  final String? pixKeyType;
  final String? pixKey;
  final String? bankName;
  final String? agency;
  final String? accountNumber;

  bool get isEligibleForAuctions =>
      driverType == 'CARWASH_SHOP' &&
      allowedServices.contains('HEAVY_SERVICE') &&
      status == 'active';

  bool get isCarwashShop =>
      driverType == 'CARWASH_SHOP' && allowedServices.contains('HEAVY_SERVICE');

  factory DriverProfileModel.fromJson(Map<String, dynamic> json) {
    final zoneJson = json['zone'] as Map<String, dynamic>?;
    return DriverProfileModel(
      driverType: json['driverType'] as String? ?? 'CAR_WASHER',
      allowedServices: _parseStringList(json['allowedServices']),
      status: json['status'] as String? ?? 'pending_documents',
      serviceRadiusKm: _parseDouble(json['serviceRadiusKm'], 5),
      zone: zoneJson != null ? ZoneSummary.fromJson(zoneJson) : null,
      pixKeyType: json['pixKeyType'] as String?,
      pixKey: json['pixKey'] as String?,
      bankName: json['bankName'] as String?,
      agency: json['agency'] as String?,
      accountNumber: json['accountNumber'] as String?,
    );
  }
}
