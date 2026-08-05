List<String> _parseStringList(dynamic value) {
  if (value is! List) return const [];
  return value.map((e) => e.toString()).toList();
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
  });

  final String driverType;
  final List<String> allowedServices;
  final String status;

  bool get isEligibleForAuctions =>
      driverType == 'CARWASH_SHOP' &&
      allowedServices.contains('HEAVY_SERVICE') &&
      status == 'active';

  bool get isCarwashShop =>
      driverType == 'CARWASH_SHOP' && allowedServices.contains('HEAVY_SERVICE');

  factory DriverProfileModel.fromJson(Map<String, dynamic> json) {
    return DriverProfileModel(
      driverType: json['driverType'] as String? ?? 'CAR_WASHER',
      allowedServices: _parseStringList(json['allowedServices']),
      status: json['status'] as String? ?? 'pending_documents',
    );
  }
}
