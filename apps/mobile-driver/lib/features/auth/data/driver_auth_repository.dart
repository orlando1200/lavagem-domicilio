import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_exception.dart';
import '../presentation/providers/driver_auth_state.dart';

final driverAuthRepositoryProvider = Provider<DriverAuthRepository>((ref) {
  return DriverAuthRepository(ref.watch(dioProvider), ref.watch(tokenStorageProvider));
});

/// Repositorio de autenticacao do lavador, conectado ao backend real
/// (POST /auth/login, GET /users/me).
class DriverAuthRepository {
  DriverAuthRepository(this._dio, this._tokenStorage);

  final Dio _dio;
  final TokenStorage _tokenStorage;

  Future<DriverUser> login(String email, String password) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final data = response.data!;
      final token = data['accessToken'] as String;
      await _tokenStorage.saveToken(token);
      return DriverUser.fromJson(data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<DriverUser?> fetchCurrentUser() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/users/me');
      return DriverUser.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> logout() => _tokenStorage.clearToken();
}
