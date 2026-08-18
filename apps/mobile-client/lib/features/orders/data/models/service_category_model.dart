double _parsePrice(dynamic value) {
  if (value == null) return 0;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? 0;
}

/// Categoria de servico com preco real (`ServiceCategory`), vinda de
/// GET /service-categories. So cobre DRY_WASH/EXPRESS_WASH — HEAVY_SERVICE
/// nao tem preco fixo (vai a leilao) e continua hardcoded no wizard.
class ServiceCategoryModel {
  const ServiceCategoryModel({
    required this.serviceType,
    required this.name,
    required this.price,
  });

  final String serviceType;
  final String name;
  final double price;

  factory ServiceCategoryModel.fromJson(Map<String, dynamic> json) {
    return ServiceCategoryModel(
      serviceType: json['serviceType'] as String,
      name: json['name'] as String,
      price: _parsePrice(json['price']),
    );
  }
}
