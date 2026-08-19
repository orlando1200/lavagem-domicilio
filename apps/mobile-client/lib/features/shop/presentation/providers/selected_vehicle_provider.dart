import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../vehicles/data/models/vehicle_model.dart';

/// Veiculo escolhido pelo cliente pra comparar compatibilidade na loja
/// (usado como `vehicleId` no catalogo/detalhe de produto). Nao persiste
/// entre sessoes — reseta a cada abertura do app, mesmo padrao simples de
/// `cart_provider.dart`.
final selectedVehicleProvider =
    StateNotifierProvider<SelectedVehicleNotifier, VehicleModel?>((ref) {
  return SelectedVehicleNotifier();
});

class SelectedVehicleNotifier extends StateNotifier<VehicleModel?> {
  SelectedVehicleNotifier() : super(null);

  void select(VehicleModel? vehicle) => state = vehicle;

  void clear() => state = null;
}
