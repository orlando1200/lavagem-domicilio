import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/document_verification_repository.dart';
import '../../data/models/document_verification_model.dart';
import '../../../../core/api/api_exception.dart';

class DocumentVerificationState {
  const DocumentVerificationState({
    this.documents = const [],
    this.isLoading = false,
    this.isSubmitting = false,
    this.errorMessage,
  });

  final List<DocumentVerification> documents;
  final bool isLoading;
  final bool isSubmitting;
  final String? errorMessage;

  DocumentVerificationState copyWith({
    List<DocumentVerification>? documents,
    bool? isLoading,
    bool? isSubmitting,
    String? Function()? errorMessage,
  }) {
    return DocumentVerificationState(
      documents: documents ?? this.documents,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage != null ? errorMessage() : this.errorMessage,
    );
  }
}

final documentVerificationProvider =
    StateNotifierProvider<DocumentVerificationNotifier, DocumentVerificationState>((ref) {
  return DocumentVerificationNotifier(ref.watch(documentVerificationRepositoryProvider));
});

class DocumentVerificationNotifier extends StateNotifier<DocumentVerificationState> {
  DocumentVerificationNotifier(this._repository) : super(const DocumentVerificationState());

  final DocumentVerificationRepository _repository;

  Future<void> loadMine() async {
    state = state.copyWith(isLoading: true, errorMessage: () => null);
    try {
      final documents = await _repository.listMine();
      state = state.copyWith(documents: documents, isLoading: false);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: () => e.message);
    }
  }

  Future<bool> uploadFile({
    required String docType,
    required Uint8List bytes,
    required String fileName,
  }) async {
    state = state.copyWith(isSubmitting: true, errorMessage: () => null);
    try {
      final document = await _repository.upload(docType: docType, bytes: bytes, fileName: fileName);
      state = state.copyWith(
        documents: [document, ...state.documents],
        isSubmitting: false,
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isSubmitting: false, errorMessage: () => e.message);
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(errorMessage: () => null);
  }
}
