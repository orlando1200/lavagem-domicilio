import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';

final usersRepositoryProvider = Provider<UsersRepository>((ref) {
  return UsersRepository(ref.watch(dioProvider));
});

/// Repositorio do proprio perfil de usuario (nao da loja), conectado ao
/// backend real (GET/PATCH /users/me).
class UsersRepository {
  UsersRepository(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> fetchMe() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/users/me');
      return response.data!;
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> updateMe({String? name, String? phone}) async {
    try {
      await _dio.patch<Map<String, dynamic>>('/users/me', data: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
      });
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
