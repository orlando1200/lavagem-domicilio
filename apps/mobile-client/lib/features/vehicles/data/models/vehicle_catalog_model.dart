// Marca/modelo/ano do catalogo estruturado (GET /vehicle-catalog/*),
// usados nos dropdowns em cascata do cadastro de veiculo.

class VehicleCatalogBrand {
  const VehicleCatalogBrand({required this.id, required this.name});

  final String id;
  final String name;

  factory VehicleCatalogBrand.fromJson(Map<String, dynamic> json) {
    return VehicleCatalogBrand(id: json['id'] as String, name: json['name'] as String);
  }
}

class VehicleCatalogModelOption {
  const VehicleCatalogModelOption({required this.id, required this.name});

  final String id;
  final String name;

  factory VehicleCatalogModelOption.fromJson(Map<String, dynamic> json) {
    return VehicleCatalogModelOption(id: json['id'] as String, name: json['name'] as String);
  }
}

class VehicleCatalogYearOption {
  const VehicleCatalogYearOption({required this.id, required this.year});

  final String id;
  final int year;

  factory VehicleCatalogYearOption.fromJson(Map<String, dynamic> json) {
    return VehicleCatalogYearOption(id: json['id'] as String, year: (json['year'] as num).toInt());
  }
}
