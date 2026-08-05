import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/auction_models.dart';

final auctionsRepositoryProvider = Provider<AuctionsRepository>((ref) {
  return AuctionsRepository(ref.watch(dioProvider));
});

/// Repositorio de leiloes do lado da loja (GET /auctions/available,
/// GET /auctions/bids/me, POST /auctions/:id/bids).
class AuctionsRepository {
  AuctionsRepository(this._dio);

  final Dio _dio;

  Future<List<AvailableAuctionModel>> fetchAvailableAuctions() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/auctions/available');
      final items = response.data?['items'] as List<dynamic>? ?? [];
      return items
          .map((json) => AvailableAuctionModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<List<MyBidModel>> fetchMyBids() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/auctions/bids/me');
      final items = response.data?['items'] as List<dynamic>? ?? [];
      return items.map((json) => MyBidModel.fromJson(json as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> submitBid(
    String auctionId, {
    required double amount,
    required int durationHours,
    required int warrantyDays,
    String? message,
    List<String>? photos,
  }) async {
    try {
      await _dio.post(
        '/auctions/$auctionId/bids',
        data: {
          'amount': amount,
          'durationHours': durationHours,
          'warrantyDays': warrantyDays,
          if (message != null && message.isNotEmpty) 'message': message,
          if (photos != null && photos.isNotEmpty) 'photos': photos,
        },
      );
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
