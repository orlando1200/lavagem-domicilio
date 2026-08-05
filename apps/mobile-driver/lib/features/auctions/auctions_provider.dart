import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'data/auctions_repository.dart';
import 'data/driver_profile_repository.dart';
import 'data/models/auction_models.dart';
import 'data/models/driver_profile_model.dart';

/// Perfil de motorista/loja do usuario logado — `null` quando ainda nao
/// existe (onboarding nunca feito).
final myDriverProfileProvider = FutureProvider.autoDispose<DriverProfileModel?>((ref) {
  return ref.watch(driverProfileRepositoryProvider).fetchMyProfile();
});

final availableAuctionsProvider =
    FutureProvider.autoDispose<List<AvailableAuctionModel>>((ref) {
  return ref.watch(auctionsRepositoryProvider).fetchAvailableAuctions();
});

final myBidsProvider = FutureProvider.autoDispose<List<MyBidModel>>((ref) {
  return ref.watch(auctionsRepositoryProvider).fetchMyBids();
});
