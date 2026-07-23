import 'package:flutter/material.dart';

/// Categorias de produtos da loja B2C GIUCAR.
enum ProductCategory {
  aromatizantes('Aromatizantes'),
  capas('Capas & Bancos'),
  acessorios('Acessórios'),
  pecas('Peças'),
  fluidos('Óleos & Fluidos'),
  limpeza('Limpeza & Cuidados'),
  organizadores('Organizadores');

  const ProductCategory(this.label);

  final String label;
}

/// Modelo de produto (mock) da loja do cliente.
class ProductModel {
  const ProductModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    required this.emoji,
    this.oldPrice,
    this.rating = 4.8,
  });

  final String id;
  final String name;
  final String description;
  final double price;
  final double? oldPrice;
  final ProductCategory category;

  /// Emoji usado como representacao visual do produto (nao ha assets de
  /// fotos de produto no repositorio; segue o padrao ja usado em telas
  /// como a home, que usa emojis para icones ilustrativos).
  final String emoji;
  final double rating;

  bool get hasDiscount => oldPrice != null && oldPrice! > price;

  IconData get fallbackIcon {
    switch (category) {
      case ProductCategory.aromatizantes:
        return Icons.spa_rounded;
      case ProductCategory.capas:
        return Icons.chair_rounded;
      case ProductCategory.acessorios:
        return Icons.directions_car_filled_rounded;
      case ProductCategory.pecas:
        return Icons.settings_rounded;
      case ProductCategory.fluidos:
        return Icons.oil_barrel_rounded;
      case ProductCategory.limpeza:
        return Icons.auto_fix_high_rounded;
      case ProductCategory.organizadores:
        return Icons.inventory_2_rounded;
    }
  }
}

/// Catalogo mock de produtos exibidos na loja B2C do app cliente.
class ProductCatalog {
  ProductCatalog._();

  static const List<ProductModel> products = [
    ProductModel(
      id: 'aroma-premium',
      name: 'Aromatizante Premium',
      description: 'Fragrância duradoura importada para o interior do carro.',
      price: 24.90,
      oldPrice: 32.90,
      category: ProductCategory.aromatizantes,
      emoji: '🌸',
    ),
    ProductModel(
      id: 'aroma-gel',
      name: 'Aromatizante Gel Automotivo',
      description: 'Gel de longa duração com fragrância suave.',
      price: 18.90,
      category: ProductCategory.aromatizantes,
      emoji: '🧴',
    ),
    ProductModel(
      id: 'capa-couro-bancos',
      name: 'Capa de Couro para Bancos',
      description: 'Proteção e conforto premium, jogo completo.',
      price: 189.90,
      oldPrice: 229.90,
      category: ProductCategory.capas,
      emoji: '🛋️',
    ),
    ProductModel(
      id: 'capa-volante',
      name: 'Capa de Volante em Couro',
      description: 'Aderência e acabamento sofisticado.',
      price: 49.90,
      category: ProductCategory.capas,
      emoji: '🎯',
    ),
    ProductModel(
      id: 'kit-lampadas-led',
      name: 'Kit Lâmpadas LED',
      description: 'Mais visibilidade e estilo para faróis.',
      price: 99.90,
      category: ProductCategory.pecas,
      emoji: '💡',
    ),
    ProductModel(
      id: 'palhetas-premium',
      name: 'Palhetas Limpador de Para-brisa',
      description: 'Par de palhetas premium, alta durabilidade.',
      price: 49.90,
      category: ProductCategory.pecas,
      emoji: '🌧️',
    ),
    ProductModel(
      id: 'filtro-ar',
      name: 'Filtro de Ar Automotivo',
      description: 'Filtragem eficiente para melhor desempenho do motor.',
      price: 59.90,
      category: ProductCategory.pecas,
      emoji: '🌬️',
    ),
    ProductModel(
      id: 'pastilha-freio',
      name: 'Pastilhas de Freio (jogo)',
      description: 'Frenagem segura, jogo dianteiro ou traseiro.',
      price: 149.90,
      oldPrice: 179.90,
      category: ProductCategory.pecas,
      emoji: '🛑',
    ),
    ProductModel(
      id: 'oleo-motor',
      name: 'Óleo de Motor Sintético 5W30',
      description: 'Proteção e desempenho, embalagem de 1 litro.',
      price: 44.90,
      category: ProductCategory.fluidos,
      emoji: '🛢️',
    ),
    ProductModel(
      id: 'aditivo-radiador',
      name: 'Aditivo / Refrigerante de Radiador',
      description: 'Proteção contra superaquecimento, 1 litro.',
      price: 29.90,
      category: ProductCategory.fluidos,
      emoji: '❄️',
    ),
    ProductModel(
      id: 'cera-carnauba',
      name: 'Cera Carnaúba',
      description: 'Brilho intenso e proteção duradoura para a pintura.',
      price: 39.90,
      category: ProductCategory.limpeza,
      emoji: '✨',
    ),
    ProductModel(
      id: 'aspirador-portatil',
      name: 'Aspirador Portátil Automotivo',
      description: 'Praticidade para limpeza rápida, uso na tomada 12V.',
      price: 79.90,
      oldPrice: 99.90,
      category: ProductCategory.limpeza,
      emoji: '🔋',
    ),
    ProductModel(
      id: 'organizador-porta-malas',
      name: 'Organizador de Porta-malas',
      description: 'Compartimentos práticos para manter tudo em ordem.',
      price: 59.90,
      category: ProductCategory.organizadores,
      emoji: '🗂️',
    ),
    ProductModel(
      id: 'organizador-banco',
      name: 'Organizador de Banco Traseiro',
      description: 'Bolsos múltiplos para itens do dia a dia.',
      price: 44.90,
      category: ProductCategory.organizadores,
      emoji: '🎒',
    ),
    ProductModel(
      id: 'suporte-celular',
      name: 'Suporte de Celular Veicular',
      description: 'Fixação firme na saída de ar, rotação 360°.',
      price: 34.90,
      category: ProductCategory.acessorios,
      emoji: '📱',
    ),
    ProductModel(
      id: 'carregador-veicular',
      name: 'Carregador Veicular USB-C',
      description: 'Carregamento rápido para até 2 dispositivos.',
      price: 39.90,
      category: ProductCategory.acessorios,
      emoji: '🔌',
    ),
  ];

  static List<ProductModel> byCategory(ProductCategory? category) {
    if (category == null) return products;
    return products.where((p) => p.category == category).toList();
  }

  static List<ProductModel> search(String query, {ProductCategory? category}) {
    final base = byCategory(category);
    if (query.trim().isEmpty) return base;
    final q = query.toLowerCase();
    return base
        .where((p) =>
            p.name.toLowerCase().contains(q) ||
            p.description.toLowerCase().contains(q))
        .toList();
  }

  static ProductModel? byId(String id) {
    for (final p in products) {
      if (p.id == id) return p;
    }
    return null;
  }
}
