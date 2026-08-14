import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/address_model.dart';
import '../../data/addresses_repository.dart';

/// FutureProvider.autoDispose para a lista de enderecos do cliente logado.
final addressesProvider = FutureProvider.autoDispose<List<AddressModel>>((ref) {
  return ref.watch(addressesRepositoryProvider).fetchMine();
});
