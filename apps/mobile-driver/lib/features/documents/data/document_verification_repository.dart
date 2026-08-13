import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import 'models/document_verification_model.dart';

final documentVerificationRepositoryProvider = Provider<DocumentVerificationRepository>((ref) {
  return DocumentVerificationRepository(ref.watch(dioProvider));
});

/// Repositorio de verificacao de documentos do lavador, conectado ao
/// backend real (DocumentVerificationModule):
///   POST /document-verification/me { docType, fileUrl } — envia documento
///   GET  /document-verification/me                      — lista os proprios documentos
class DocumentVerificationRepository {
  DocumentVerificationRepository(this._dio);

  final Dio _dio;

  Future<List<DocumentVerification>> listMine() async {
    try {
      final response = await _dio.get('/document-verification/me');
      final items = response.data as List<dynamic>;
      return items
          .map((item) => DocumentVerification.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  Future<DocumentVerification> submit({required String docType, required String fileUrl}) async {
    try {
      final response = await _dio.post(
        '/document-verification/me',
        data: {'docType': docType, 'fileUrl': fileUrl},
      );
      return DocumentVerification.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}
