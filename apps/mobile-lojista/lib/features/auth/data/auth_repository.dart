import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_exception.dart';
import '../../../../core/api/token_storage.dart';
import '../../../../core/constants/app_constants.dart';
import '../presentation/providers/auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
      ref.watch(dioProvider), ref.watch(tokenStorageProvider));
});

String _storeTypeToBackend(StoreType type) {
  switch (type) {
    case StoreType.lavador:
      return 'LAVADOR';
    case StoreType.cliente:
      return 'CLIENTE';
  }
}

String _logisticsModeToBackend(LogisticsMode mode) {
  switch (mode) {
    case LogisticsMode.integrada:
      return 'INTEGRATED';
    case LogisticsMode.propria:
      return 'OWN';
  }
}

StoreType _storeTypeFromBackend(String value) {
  return value == 'CLIENTE' ? StoreType.cliente : StoreType.lavador;
}

LogisticsMode _logisticsModeFromBackend(String value) {
  return value == 'OWN' ? LogisticsMode.propria : LogisticsMode.integrada;
}

/// Repositorio de autenticacao/cadastro do lojista, conectado ao backend
/// real: POST /auth/login, POST /auth/register (cria o User) e
/// POST /stores (cria a Store vinculada ao usuario recem-criado).
class AuthRepository {
  AuthRepository(this._dio, this._tokenStorage);

  final Dio _dio;
  final TokenStorage _tokenStorage;

  Future<StoreUser> login(String email, String password) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final data = response.data!;
      final token = data['accessToken'] as String;
      await _tokenStorage.saveToken(token);
      final user = data['user'] as Map<String, dynamic>;

      final storeId = await _tokenStorage.readStoreId();
      final storeDetails =
          storeId != null ? await _fetchStoreDetails(storeId) : null;

      return StoreUser(
        id: user['id'] as String,
        storeName: user['name'] as String? ?? '',
        email: user['email'] as String? ?? email,
        storeType: storeDetails?.storeType ?? StoreType.lavador,
        logisticsMode: storeDetails?.logisticsMode ?? LogisticsMode.integrada,
        storeId: storeId,
        commissionMonthlyFee: storeDetails?.commissionMonthlyFee,
        commissionTakeRate: storeDetails?.commissionTakeRate,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Busca os dados reais da loja (GET /stores/:id) — tipo de loja,
  /// modalidade de logistica e plano de comissao. Antes deste fix,
  /// `login`/`fetchCurrentUser` sempre devolviam `LAVADOR`/`INTEGRATED`
  /// hardcoded, entao a tela de Plano mostrava dado errado pra qualquer
  /// loja que nao fosse essa combinacao exata.
  Future<
      ({
        StoreType storeType,
        LogisticsMode logisticsMode,
        double? commissionMonthlyFee,
        double? commissionTakeRate,
      })> _fetchStoreDetails(String storeId) async {
    final response = await _dio.get<Map<String, dynamic>>('/stores/$storeId');
    final store = response.data!;
    final commissionPlan = store['commissionPlan'] as Map<String, dynamic>?;

    return (
      storeType: _storeTypeFromBackend(store['storeType'] as String),
      logisticsMode:
          _logisticsModeFromBackend(store['logisticsPlan'] as String),
      commissionMonthlyFee: commissionPlan != null
          ? double.tryParse(commissionPlan['monthlyFee'].toString())
          : null,
      commissionTakeRate: commissionPlan != null
          ? double.tryParse(commissionPlan['takeRate'].toString())
          : null,
    );
  }

  /// Cria o usuario (POST /auth/register) e, em seguida, a loja vinculada
  /// (POST /stores) — o dono da loja e sempre o usuario autenticado
  /// (token do registro), o backend nao aceita mais um ownerUserId
  /// arbitrario no corpo.
  Future<StoreUser> register({
    required String storeName,
    required String email,
    required String password,
    required String document,
    required StoreType storeType,
    required LogisticsMode logisticsMode,
  }) async {
    try {
      final registerResponse = await _dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'name': storeName,
          'email': email,
          'password': password,
          'role': 'LAVADOR',
        },
      );
      final registerData = registerResponse.data!;
      final token = registerData['accessToken'] as String;
      await _tokenStorage.saveToken(token);
      final user = registerData['user'] as Map<String, dynamic>;
      final ownerUserId = user['id'] as String;

      final storeResponse = await _dio.post<Map<String, dynamic>>(
        '/stores',
        data: {
          'name': storeName,
          'document': document,
          'email': email,
          'storeType': _storeTypeToBackend(storeType),
          'logisticsPlan': _logisticsModeToBackend(logisticsMode),
        },
      );
      final storeId = storeResponse.data!['id'] as String;
      await _tokenStorage.saveStoreId(storeId);
      final commissionPlan =
          storeResponse.data!['commissionPlan'] as Map<String, dynamic>?;

      return StoreUser(
        id: ownerUserId,
        storeName: storeName,
        email: email,
        storeType: storeType,
        logisticsMode: logisticsMode,
        storeId: storeId,
        commissionMonthlyFee: commissionPlan != null
            ? double.tryParse(commissionPlan['monthlyFee'].toString())
            : null,
        commissionTakeRate: commissionPlan != null
            ? double.tryParse(commissionPlan['takeRate'].toString())
            : null,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<StoreUser?> fetchCurrentUser() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/users/me');
      final user = response.data!;
      final storeId = await _tokenStorage.readStoreId();
      final storeDetails =
          storeId != null ? await _fetchStoreDetails(storeId) : null;

      return StoreUser(
        id: user['id'] as String,
        storeName: user['name'] as String? ?? '',
        email: user['email'] as String? ?? '',
        storeType: storeDetails?.storeType ?? StoreType.lavador,
        logisticsMode: storeDetails?.logisticsMode ?? LogisticsMode.integrada,
        storeId: storeId,
        commissionMonthlyFee: storeDetails?.commissionMonthlyFee,
        commissionTakeRate: storeDetails?.commissionTakeRate,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<void> logout() => _tokenStorage.clearAll();
}
