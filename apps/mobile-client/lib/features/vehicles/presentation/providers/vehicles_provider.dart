import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/vehicle_model.dart';
import '../../data/vehicles_repository.dart';

/// FutureProvider.autoDispose para a lista de veiculos do cliente logado.
final vehiclesProvider = FutureProvider.autoDispose<List<VehicleModel>>((ref) {
  return ref.watch(vehiclesRepositoryProvider).fetchMine();
});
