import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  TokenStorage() : _storage = const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _tokenKey = 'giucar_lojista_access_token';
  static const _storeIdKey = 'giucar_lojista_store_id';
  static const _deviceIdKey = 'giucar_lojista_device_id';

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<String?> readStoreId() => _storage.read(key: _storeIdKey);

  Future<void> saveStoreId(String storeId) =>
      _storage.write(key: _storeIdKey, value: storeId);

  /// Identificador local persistente do dispositivo, usado como token
  /// de push em modo simulado (nao ha SDK real do Firebase configurado
  /// ainda). Gerado uma unica vez e reaproveitado entre sessoes.
  Future<String> readOrCreateDeviceId() async {
    final existing = await _storage.read(key: _deviceIdKey);
    if (existing != null) return existing;

    final random = Random.secure();
    final id = List.generate(16, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
    await _storage.write(key: _deviceIdKey, value: id);
    return id;
  }

  Future<void> clearAll() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _storeIdKey);
  }
}
