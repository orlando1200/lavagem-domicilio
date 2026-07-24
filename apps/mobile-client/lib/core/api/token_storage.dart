import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Armazenamento seguro do token de autenticacao (JWT) emitido pelo
/// backend em POST /auth/login ou /auth/register.
class TokenStorage {
  TokenStorage() : _storage = const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _tokenKey = 'giucar_access_token';

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: _tokenKey);
}
