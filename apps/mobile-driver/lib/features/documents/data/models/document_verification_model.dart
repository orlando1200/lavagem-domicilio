/// Status de verificacao de um documento enviado pelo lavador, espelhando
/// o enum `DocumentVerificationStatus` do backend (pending, approved, rejected).
enum DocumentVerificationStatus {
  pending,
  approved,
  rejected;

  static DocumentVerificationStatus fromBackend(String value) {
    return DocumentVerificationStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => DocumentVerificationStatus.pending,
    );
  }
}

extension DocumentVerificationStatusX on DocumentVerificationStatus {
  String get label {
    switch (this) {
      case DocumentVerificationStatus.pending:
        return 'Em análise';
      case DocumentVerificationStatus.approved:
        return 'Aprovado';
      case DocumentVerificationStatus.rejected:
        return 'Rejeitado';
    }
  }
}

/// Documento enviado pelo lavador para verificacao (CNH, CRLV, foto do
/// veiculo, etc). O envio e feito por link (`fileUrl`) — nao ha upload
/// binario de arquivo no app, o lavador cola o link de onde o documento
/// ja esta hospedado.
class DocumentVerification {
  const DocumentVerification({
    required this.id,
    required this.docType,
    required this.fileUrl,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String docType;
  final String fileUrl;
  final DocumentVerificationStatus status;
  final DateTime createdAt;

  factory DocumentVerification.fromJson(Map<String, dynamic> json) {
    return DocumentVerification(
      id: json['id'] as String,
      docType: json['docType'] as String,
      fileUrl: json['fileUrl'] as String,
      status: DocumentVerificationStatus.fromBackend(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
