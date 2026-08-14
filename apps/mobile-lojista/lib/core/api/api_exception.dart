import 'package:dio/dio.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isConnectivityError => statusCode == null;

  factory ApiException.fromDioException(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
            'Tempo de conexao esgotado. Verifique sua internet.');
      case DioExceptionType.connectionError:
        return ApiException('Nao foi possivel conectar ao servidor.');
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final data = error.response?.data;
        final message =
            _extractMessage(data) ?? 'Erro ao comunicar com o servidor.';
        return ApiException(message, statusCode: statusCode);
      case DioExceptionType.cancel:
        return ApiException('Requisicao cancelada.');
      default:
        return ApiException('Ocorreu um erro inesperado. Tente novamente.');
    }
  }

  static String? _extractMessage(dynamic data) {
    if (data is Map) {
      final message = data['message'];
      if (message is String) return message;
      if (message is List && message.isNotEmpty)
        return message.first.toString();
    }
    return null;
  }

  @override
  String toString() => message;
}
