import 'package:flutter_test/flutter_test.dart';
import 'package:giucar_mobile_driver/features/shop/data/models/product_model.dart';

void main() {
  group('ProductModel.fromJson (loja do lavador)', () {
    test('faz parse de price quando vem como string (Decimal do Prisma)', () {
      final product = ProductModel.fromJson({
        'id': 'p1',
        'storeId': 's1',
        'name': 'Kit Microfibra',
        'slug': 'kit-microfibra',
        'price': '19.90',
        'stockQuantity': 100,
      });

      expect(product.price, 19.9);
    });

    test('inStock reflete stockQuantity', () {
      final produto = ProductModel.fromJson({
        'id': 'p1',
        'storeId': 's1',
        'name': 'Produto',
        'price': '10',
        'stockQuantity': 0,
      });

      expect(produto.inStock, isFalse);
    });
  });
}
