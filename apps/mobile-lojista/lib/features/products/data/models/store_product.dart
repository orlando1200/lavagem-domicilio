import '../../../../core/constants/app_constants.dart';

/// Modelo de produto do lojista, espelhando o retorno do backend
/// (GET/POST /stores/:id/products).
class StoreProduct {
  const StoreProduct({
    required this.id,
    required this.name,
    required this.price,
    required this.stockQuantity,
    required this.catalogTarget,
    this.status = 'pending_approval',
    this.rejectionReason,
  });

  final String id;
  final String name;
  final double price;
  final int stockQuantity;
  final CatalogTarget catalogTarget;
  final String status;
  final String? rejectionReason;

  factory StoreProduct.fromJson(Map<String, dynamic> json) {
    return StoreProduct(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      stockQuantity: (json['stockQuantity'] as num?)?.toInt() ?? 0,
      catalogTarget: _catalogTargetFromBackend(json['catalogTarget'] as String?),
      status: json['status'] as String? ?? 'pending_approval',
      rejectionReason: json['rejectionReason'] as String?,
    );
  }

  /// Mapeia o status do backend (ProductStatus: draft, pending_approval,
  /// active, inactive, rejected) para o enum local [ProductStatus].
  ProductStatus get uiStatus {
    switch (status) {
      case 'active':
        return ProductStatus.ativo;
      case 'rejected':
        return ProductStatus.rejeitado;
      default:
        return ProductStatus.pendente;
    }
  }
}

CatalogTarget _catalogTargetFromBackend(String? value) {
  switch (value) {
    case 'LAVADOR':
      return CatalogTarget.lojaLavador;
    case 'CLIENTE':
      return CatalogTarget.lojaCliente;
    default:
      return CatalogTarget.ambas;
  }
}

String catalogTargetToBackend(CatalogTarget target) {
  switch (target) {
    case CatalogTarget.lojaLavador:
      return 'LAVADOR';
    case CatalogTarget.lojaCliente:
      return 'CLIENTE';
    case CatalogTarget.ambas:
      return 'AMBOS';
  }
}
