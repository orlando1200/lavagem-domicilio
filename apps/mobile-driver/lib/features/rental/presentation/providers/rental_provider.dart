import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/rental_model.dart';
import '../../data/rental_repository.dart';

/// Aluguel de moto atual/mais recente do lavador logado (null = nunca
/// solicitou nenhum).
final myRentalProvider = FutureProvider.autoDispose<RentalModel?>((ref) {
  return ref.watch(rentalRepositoryProvider).fetchMine();
});
