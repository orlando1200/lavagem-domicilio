/// Decimal do Prisma serializa como string no JSON (ex.: "49.90"), nao
/// como numero — parse defensivo que aceita os dois formatos.
double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Produto real da loja de insumos do lavador (GET /marketplace/driver/catalog,
/// GET /marketplace/products/:id), modulo `marketplace`.
class ProductModel {
  const ProductModel({
    required this.id,
    required this.storeId,
    required this.name,
    required this.slug,
    required this.price,
    required this.stockQuantity,
    this.description,
    this.sku,
    this.category,
    this.weightGrams,
    this.storeName,
  });

  final String id;
  final String storeId;
  final String name;
  final String slug;
  final double price;
  final int stockQuantity;
  final String? description;
  final String? sku;
  final String? category;
  final int? weightGrams;
  final String? storeName;

  bool get inStock => stockQuantity > 0;

  /// Nao ha campo de imagem/emoji no `Product` real do backend — usa a
  /// inicial do nome como avatar visual (cor deterministica fica a
  /// cargo da UI, nao do model).
  String get initial =>
      name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final store = json['store'] as Map<String, dynamic>?;
    return ProductModel(
      id: json['id'] as String,
      storeId: json['storeId'] as String? ?? store?['id'] as String? ?? '',
      name: json['name'] as String,
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      sku: json['sku'] as String?,
      category: json['category'] as String?,
      price: _parseDouble(json['price']),
      stockQuantity: (json['stockQuantity'] as num?)?.toInt() ?? 0,
      weightGrams: (json['weightGrams'] as num?)?.toInt(),
      storeName: store?['name'] as String?,
    );
  }
}
