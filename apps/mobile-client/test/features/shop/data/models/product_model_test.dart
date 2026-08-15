import 'package:flutter_test/flutter_test.dart';
import 'package:giucar_mobile_client/features/shop/data/models/product_model.dart';

void main() {
  group('ProductModel.fromJson', () {
    test('faz parse de price quando vem como string (Decimal do Prisma)', () {
      final product = ProductModel.fromJson({
        'id': 'p1',
        'storeId': 's1',
        'name': 'Shampoo Automotivo',
        'slug': 'shampoo-automotivo',
        'price': '29.90',
        'stockQuantity': 50,
      });

      expect(product.price, 29.9);
      expect(product.stockQuantity, 50);
    });

    test('inStock reflete stockQuantity', () {
      final semEstoque = ProductModel.fromJson({
        'id': 'p1',
        'storeId': 's1',
        'name': 'Produto',
        'price': '10',
        'stockQuantity': 0,
      });
      final comEstoque = ProductModel.fromJson({
        'id': 'p2',
        'storeId': 's1',
        'name': 'Produto',
        'price': '10',
        'stockQuantity': 1,
      });

      expect(semEstoque.inStock, isFalse);
      expect(comEstoque.inStock, isTrue);
    });

    test('storeId cai pro id aninhado em store quando ausente no topo', () {
      final product = ProductModel.fromJson({
        'id': 'p1',
        'name': 'Produto',
        'price': '10',
        'stockQuantity': 1,
        'store': {'id': 'store-aninhado', 'name': 'Loja X'},
      });

      expect(product.storeId, 'store-aninhado');
      expect(product.storeName, 'Loja X');
    });

    test('initial usa a primeira letra do nome em maiuscula', () {
      final product = ProductModel.fromJson({
        'id': 'p1',
        'storeId': 's1',
        'name': 'cera automotiva',
        'price': '10',
        'stockQuantity': 1,
      });

      expect(product.initial, 'C');
    });
  });
}
