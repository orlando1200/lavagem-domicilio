import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/address_model.dart';

final addressesRepositoryProvider = Provider<AddressesRepository>((ref) {
  return AddressesRepository(ref.watch(dioProvider));
});

/// Repositorio de enderecos do cliente, conectado ao backend real
/// (AddressesModule): POST /addresses, GET /addresses/me (array puro,
/// sem paginacao).
class AddressesRepository {
  AddressesRepository(this._dio);

  final Dio _dio;

  Future<List<AddressModel>> fetchMine() async {
    try {
      final response = await _dio.get<List<dynamic>>('/addresses/me');
      final items = response.data ?? [];
      return items
          .map((json) => AddressModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<AddressModel> create({
    String? label,
    required String street,
    required String number,
    String? complement,
    required String neighborhood,
    required String city,
    required String state,
    required String zipCode,
  }) async {
    try {
      final response =
          await _dio.post<Map<String, dynamic>>('/addresses', data: {
        if (label != null && label.isNotEmpty) 'label': label,
        'street': street,
        'number': number,
        if (complement != null && complement.isNotEmpty)
          'complement': complement,
        'neighborhood': neighborhood,
        'city': city,
        'state': state,
        'zipCode': zipCode,
      });
      return AddressModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
