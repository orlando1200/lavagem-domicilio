import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'data/models/auction_model.dart';
import 'data/auctions_repository.dart';

/// Lista de leiloes do cliente logado (GET /auctions/me).
final myAuctionsProvider = FutureProvider.autoDispose<List<AuctionModel>>((ref) {
  return ref.watch(auctionsRepositoryProvider).fetchMyAuctions();
});

/// Detalhe de um leilao, com pujas ja rankeadas pelo backend
/// (GET /auctions/me/:id).
final auctionDetailProvider =
    FutureProvider.autoDispose.family<AuctionDetailModel, String>((ref, id) {
  return ref.watch(auctionsRepositoryProvider).fetchAuction(id);
});
