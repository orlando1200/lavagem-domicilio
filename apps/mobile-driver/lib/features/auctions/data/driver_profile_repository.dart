import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/driver_profile_model.dart';

final driverProfileRepositoryProvider = Provider<DriverProfileRepository>((ref) {
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
      final response = await _dio.get<Map<String, dynamic>>('/driver-profiles/me');
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
  Future<DriverProfileModel> activateCarwashShop({bool hasExistingProfile = false}) async {
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
}
