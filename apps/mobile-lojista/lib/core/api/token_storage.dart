import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  TokenStorage() : _storage = const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _tokenKey = 'giucar_lojista_access_token';
  static const _storeIdKey = 'giucar_lojista_store_id';

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<String?> readStoreId() => _storage.read(key: _storeIdKey);

  Future<void> saveStoreId(String storeId) => _storage.write(key: _storeIdKey, value: storeId);

  Future<void> clearAll() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _storeIdKey);
  }
}
