import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'data/marketplace_repository.dart';
import 'data/models/product_model.dart';
import 'presentation/providers/selected_vehicle_provider.dart';

/// Catalogo real da loja (GET /marketplace/client/catalog). Observa o
/// veiculo selecionado — troca de veiculo recalcula `compatibility` em
/// cada produto automaticamente.
final catalogProvider = FutureProvider.autoDispose<List<ProductModel>>((ref) {
  final vehicleId = ref.watch(selectedVehicleProvider)?.id;
  return ref.watch(marketplaceRepositoryProvider).fetchClientCatalog(vehicleId: vehicleId);
});

/// Detalhe de um produto (GET /marketplace/products/:id), mesma logica de
/// `vehicleId` do catalogo.
final productDetailProvider =
    FutureProvider.autoDispose.family<ProductModel, String>((ref, id) {
  final vehicleId = ref.watch(selectedVehicleProvider)?.id;
  return ref.watch(marketplaceRepositoryProvider).fetchProduct(id, vehicleId: vehicleId);
});
