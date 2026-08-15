import 'package:flutter_test/flutter_test.dart';
import 'package:giucar_mobile_lojista/features/products/data/models/store_product.dart';
import 'package:giucar_mobile_lojista/core/constants/app_constants.dart';

void main() {
  group('StoreProduct.fromJson', () {
    test('faz parse de price quando vem como string (Decimal do Prisma)', () {
      // Product.price e Decimal(12,2) no schema — serializa como string
      // ("29.90"), nao numero. Cast direto `as num?` quebrava com
      // TypeError (bug real desta sessao, corrigido junto com este teste).
      final product = StoreProduct.fromJson({
        'id': 'p1',
        'name': 'Cera Automotiva',
        'price': '29.90',
        'stockQuantity': 30,
        'catalogTarget': 'AMBOS',
      });

      expect(product.price, 29.9);
    });

    test('mapeia catalogTarget do backend pro enum local', () {
      final ambos = StoreProduct.fromJson({
        'id': 'p1',
        'name': 'X',
        'price': '10',
        'stockQuantity': 1,
        'catalogTarget': 'AMBOS',
      });
      final lavador = StoreProduct.fromJson({
        'id': 'p2',
        'name': 'X',
        'price': '10',
        'stockQuantity': 1,
        'catalogTarget': 'LAVADOR',
      });
      final cliente = StoreProduct.fromJson({
        'id': 'p3',
        'name': 'X',
        'price': '10',
        'stockQuantity': 1,
        'catalogTarget': 'CLIENTE',
      });

      expect(ambos.catalogTarget, CatalogTarget.ambas);
      expect(lavador.catalogTarget, CatalogTarget.lojaLavador);
      expect(cliente.catalogTarget, CatalogTarget.lojaCliente);
    });

    test('mapeia status do backend pro uiStatus local', () {
      final ativo = StoreProduct.fromJson({
        'id': 'p1',
        'name': 'X',
        'price': '10',
        'stockQuantity': 1,
        'catalogTarget': 'AMBOS',
        'status': 'active',
      });
      final rejeitado = StoreProduct.fromJson({
        'id': 'p2',
        'name': 'X',
        'price': '10',
        'stockQuantity': 1,
        'catalogTarget': 'AMBOS',
        'status': 'rejected',
      });
      final pendente = StoreProduct.fromJson({
        'id': 'p3',
        'name': 'X',
        'price': '10',
        'stockQuantity': 1,
        'catalogTarget': 'AMBOS',
        'status': 'pending_approval',
      });

      expect(ativo.uiStatus, ProductStatus.ativo);
      expect(rejeitado.uiStatus, ProductStatus.rejeitado);
      expect(pendente.uiStatus, ProductStatus.pendente);
    });

    test('catalogTargetToBackend faz o caminho inverso corretamente', () {
      expect(catalogTargetToBackend(CatalogTarget.ambas), 'AMBOS');
      expect(catalogTargetToBackend(CatalogTarget.lojaLavador), 'LAVADOR');
      expect(catalogTargetToBackend(CatalogTarget.lojaCliente), 'CLIENTE');
    });
  });
}
