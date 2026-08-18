import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/driver_profile_model.dart';

final driverProfileRepositoryProvider =
    Provider<DriverProfileRepository>((ref) {
  return DriverProfileRepository(ref.watch(dioProvider));
});

/// Repositorio do perfil de motorista/loja do usuario autenticado
/// (modulo `drivers`, `/driver-profiles/me`).
class DriverProfileRepository {
  DriverProfileRepository(this._dio);

  final Dio _dio;

  /// Retorna `null` quando o usuario ainda nao tem nenhum perfil criado
  /// (404 — onboarding nunca feito), em vez de lancar excecao.
  Future<DriverProfileModel?> fetchMyProfile() async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/driver-profiles/me');
      return DriverProfileModel.fromJson(response.data!);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      throw ApiException.fromDioException(e);
    }
  }

  /// Cria o perfil de motorista/loja do usuario recem-cadastrado, com o
  /// `driverType` escolhido no fluxo de registro (moto/carro/loja).
  Future<DriverProfileModel> createProfile({
    required String driverType,
    List<String>? allowedServices,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/driver-profiles/me',
        data: {
          'driverType': driverType,
          if (allowedServices != null) 'allowedServices': allowedServices,
        },
      );
      return DriverProfileModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Ativa o modo "Loja de Carwash" (elegivel a leiloes de servico
  /// pesado): cria o perfil se ainda nao existir, ou atualiza um perfil
  /// existente (ex.: motorista de moto/carro que quer tambem virar loja).
  Future<DriverProfileModel> activateCarwashShop(
      {bool hasExistingProfile = false}) async {
    try {
      final response = hasExistingProfile
          ? await _dio.patch<Map<String, dynamic>>(
              '/driver-profiles/me',
              data: const {
                'driverType': 'CARWASH_SHOP',
                'allowedServices': ['HEAVY_SERVICE'],
              },
            )
          : await _dio.post<Map<String, dynamic>>(
              '/driver-profiles/me',
              data: const {
                'driverType': 'CARWASH_SHOP',
                'allowedServices': ['HEAVY_SERVICE'],
              },
            );
      return DriverProfileModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Atualiza a area de atuacao (zona de cobertura + raio de
  /// atendimento em km).
  Future<DriverProfileModel> updateArea({
    String? currentZoneId,
    double? serviceRadiusKm,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/driver-profiles/me',
        data: {
          if (currentZoneId != null) 'currentZoneId': currentZoneId,
          if (serviceRadiusKm != null) 'serviceRadiusKm': serviceRadiusKm,
        },
      );
      return DriverProfileModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Reporta a posicao atual do lavador (tracking em tempo real,
  /// consumido pelo cliente via GET /orders/:id/driver-location).
  Future<void> updateLocation({required double latitude, required double longitude}) async {
    try {
      await _dio.patch<Map<String, dynamic>>(
        '/driver-profiles/me/location',
        data: {'latitude': latitude, 'longitude': longitude},
      );
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Define disponibilidade pra receber pedidos/leiloes (toggle online/
  /// offline da home). So aceita `active`/`inactive` — demais status
  /// exigem aprovacao do admin (PATCH /driver-profiles/me/availability).
  Future<DriverProfileModel> updateAvailability({required bool online}) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/driver-profiles/me/availability',
        data: {'status': online ? 'active' : 'inactive'},
      );
      return DriverProfileModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Atualiza os dados bancarios/PIX (usados nos repasses). Preenchimento
  /// parcial permitido — so os campos enviados sao alterados.
  Future<DriverProfileModel> updateBankInfo({
    String? pixKeyType,
    String? pixKey,
    String? bankName,
    String? agency,
    String? accountNumber,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/driver-profiles/me/bank-info',
        data: {
          if (pixKeyType != null) 'pixKeyType': pixKeyType,
          if (pixKey != null) 'pixKey': pixKey,
          if (bankName != null) 'bankName': bankName,
          if (agency != null) 'agency': agency,
          if (accountNumber != null) 'accountNumber': accountNumber,
        },
      );
      return DriverProfileModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
