import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/vehicle_catalog_model.dart';
import '../../data/models/vehicle_model.dart';
import '../../data/vehicles_repository.dart';

/// FutureProvider.autoDispose para a lista de veiculos do cliente logado.
final vehiclesProvider = FutureProvider.autoDispose<List<VehicleModel>>((ref) {
  return ref.watch(vehiclesRepositoryProvider).fetchMine();
});

/// Marcas do catalogo estruturado, pro primeiro dropdown do cadastro.
final vehicleCatalogBrandsProvider =
    FutureProvider.autoDispose<List<VehicleCatalogBrand>>((ref) {
  return ref.watch(vehiclesRepositoryProvider).fetchCatalogBrands();
});

/// Modelos de uma marca, pro segundo dropdown (habilitado so apos
/// escolher a marca).
final vehicleCatalogModelsProvider = FutureProvider.autoDispose
    .family<List<VehicleCatalogModelOption>, String>((ref, brandId) {
  return ref.watch(vehiclesRepositoryProvider).fetchCatalogModels(brandId);
});

/// Anos de um modelo, pro terceiro dropdown (habilitado so apos
/// escolher o modelo).
final vehicleCatalogYearsProvider = FutureProvider.autoDispose
    .family<List<VehicleCatalogYearOption>, String>((ref, modelId) {
  return ref.watch(vehiclesRepositoryProvider).fetchCatalogYears(modelId);
});
