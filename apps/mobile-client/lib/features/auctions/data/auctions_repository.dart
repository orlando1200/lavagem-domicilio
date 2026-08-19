import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/auction_model.dart';

final auctionsRepositoryProvider = Provider<AuctionsRepository>((ref) {
  return AuctionsRepository(ref.watch(dioProvider));
});

/// Repositorio de leiloes de servico pesado do cliente, conectado ao
/// backend real (modulo `auctions`: POST /auctions, GET /auctions/me[/:id],
/// PATCH /auctions/me/:id/cancel, PATCH /auctions/me/:id/bids/:bidId/accept).
class AuctionsRepository {
  AuctionsRepository(this._dio);

  final Dio _dio;

  Future<List<AuctionModel>> fetchMyAuctions() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/auctions/me');
      final items = response.data?['items'] as List<dynamic>? ?? [];
      return items
          .map((json) => AuctionModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<AuctionDetailModel> fetchAuction(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/auctions/me/$id');
      return AuctionDetailModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<AuctionModel> createAuction({
    required String orderId,
    required List<String> serviceIds,
    double? maxBudget,
    int? deadlineHours,
    List<String>? photos,
    String? description,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auctions',
        data: {
          'orderId': orderId,
          'serviceIds': serviceIds,
          if (maxBudget != null) 'maxBudget': maxBudget,
          if (deadlineHours != null) 'deadlineHours': deadlineHours,
          if (photos != null && photos.isNotEmpty) 'photos': photos,
          if (description != null && description.isNotEmpty) 'description': description,
        },
      );
      return AuctionModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> cancelAuction(String id) async {
    try {
      await _dio.patch('/auctions/me/$id/cancel');
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<AuctionDetailModel> acceptBid(String auctionId, String bidId) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/auctions/me/$auctionId/bids/$bidId/accept',
      );
      return AuctionDetailModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
