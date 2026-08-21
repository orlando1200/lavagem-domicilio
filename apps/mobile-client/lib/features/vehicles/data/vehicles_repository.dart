import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/fiscal_debt_model.dart';
import 'models/plate_lookup_model.dart';
import 'models/vehicle_catalog_model.dart';
import 'models/vehicle_model.dart';

// Placa antiga (AAA-1234/AAA1234) ou Mercosul (AAA1A23) — hifen opcional.
// Espelha PLATE_REGEX do backend (services/api/.../dto/vehicles.dto.ts).
final _oldPlateRegex = RegExp(r'^[A-Z]{3}-?\d{4}$');
final _mercosulPlateRegex = RegExp(r'^[A-Z]{3}\d[A-Z]\d{2}$');

/// Valida o formato da placa no cliente antes de disparar a consulta —
/// mesmas regras do backend, so pra evitar uma chamada de rede inutil.
bool isValidPlateFormat(String plate) {
  final normalized = plate.toUpperCase().replaceAll(RegExp(r'[\s-]'), '');
  return _oldPlateRegex.hasMatch(normalized) || _mercosulPlateRegex.hasMatch(normalized);
}

final vehiclesRepositoryProvider = Provider<VehiclesRepository>((ref) {
  return VehiclesRepository(ref.watch(dioProvider));
});

/// Repositorio de veiculos do cliente, conectado ao backend real
/// (VehiclesModule): POST /vehicles, GET /vehicles/me (array puro,
/// sem paginacao) + catalogo estruturado publico (GET /vehicle-catalog/*,
/// usado so pelos dropdowns em cascata do cadastro).
class VehiclesRepository {
  VehiclesRepository(this._dio);

  final Dio _dio;

  Future<List<VehicleModel>> fetchMine() async {
    try {
      final response = await _dio.get<List<dynamic>>('/vehicles/me');
      final items = response.data ?? [];
      return items
          .map((json) => VehicleModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<VehicleModel> create({
    required VehicleType type,
    required String brand,
    required String model,
    String? color,
    required String plate,
    String? catalogYearId,
    CarSize? size,
    String? renavam,
  }) async {
    try {
      final response =
          await _dio.post<Map<String, dynamic>>('/vehicles', data: {
        'type': type.name,
        'brand': brand,
        'model': model,
        if (color != null && color.isNotEmpty) 'color': color,
        'plate': plate,
        if (catalogYearId != null) 'catalogYearId': catalogYearId,
        if (size != null) 'size': size.name,
        if (renavam != null) 'renavam': renavam,
      });
      return VehicleModel.fromJson(response.data!);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<List<VehicleCatalogBrand>> fetchCatalogBrands() async {
    try {
      final response = await _dio.get<List<dynamic>>('/vehicle-catalog/brands');
      final items = response.data ?? [];
      return items.map((j) => VehicleCatalogBrand.fromJson(j as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<List<VehicleCatalogModelOption>> fetchCatalogModels(String brandId) async {
    try {
      final response = await _dio.get<List<dynamic>>(
        '/vehicle-catalog/models',
        queryParameters: {'brandId': brandId},
      );
      final items = response.data ?? [];
      return items.map((j) => VehicleCatalogModelOption.fromJson(j as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  /// Consulta `GET /vehicles/lookup-plate/:plate`. `null` significa placa
  /// nao encontrada (404 do backend) — nao e um erro, e um resultado
  /// valido do fluxo (estado "NotFound" na UI). Qualquer outro erro de
  /// rede/servidor continua sendo relancado como `ApiException`.
  Future<PlateLookupResult?> lookupPlate(String plate) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/vehicles/lookup-plate/$plate');
      return PlateLookupResult.fromJson(response.data!);
    } on DioException catch (e) {
      final exception = ApiException.fromDioException(e);
      if (exception.statusCode == 404) return null;
      throw exception;
    }
  }

  /// Consulta `GET /vehicles/:id/fiscal-debts` (IPVA/multas/licenciamento
  /// — modo simulado). So consulta: nenhum pagamento e feito por aqui.
  Future<List<FiscalDebtEntry>> fetchFiscalDebts(String vehicleId) async {
    try {
      final response = await _dio.get<List<dynamic>>('/vehicles/$vehicleId/fiscal-debts');
      final items = response.data ?? [];
      return items.map((j) => FiscalDebtEntry.fromJson(j as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<List<VehicleCatalogYearOption>> fetchCatalogYears(String modelId) async {
    try {
      final response = await _dio.get<List<dynamic>>(
        '/vehicle-catalog/years',
        queryParameters: {'modelId': modelId},
      );
      final items = response.data ?? [];
      return items.map((j) => VehicleCatalogYearOption.fromJson(j as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
