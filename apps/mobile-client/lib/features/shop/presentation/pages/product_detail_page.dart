import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/product_model.dart';
import '../providers/cart_provider.dart';

/// Tela de detalhe do produto da loja B2C.
class ProductDetailPage extends ConsumerStatefulWidget {
  const ProductDetailPage({super.key, required this.productId});

  final String productId;

  @override
  ConsumerState<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends ConsumerState<ProductDetailPage> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final product = ProductCatalog.byId(widget.productId);

    if (product == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Produto')),
        body: Center(
          child: Text('Produto não encontrado.', style: TextStyle(color: AppColors.textSecondary)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(product.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                color: AppColors.primaryContainer,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(color: AppColors.glow, blurRadius: 32, spreadRadius: -6),
                ],
              ),
              child: Center(
                child: Text(product.emoji, style: const TextStyle(fontSize: 76)),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.accentContainer,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.accent),
            ),
            child: Text(
              product.category.label,
              style: const TextStyle(
                color: AppColors.accentAlt,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            product.name,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.star_rounded, color: AppColors.primary, size: 18),
              const SizedBox(width: 4),
              Text(
                product.rating.toStringAsFixed(1),
                style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'R\$ ${product.price.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (product.hasDiscount) ...[
                const SizedBox(width: 10),
                Padding(
                  padding: const EdgeInsets.only(bottom: 5),
                  child: Text(
                    'R\$ ${product.oldPrice!.toStringAsFixed(2)}',
                    style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 15,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          NeonSurface(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Descrição',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  product.description,
                  style: TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          NeonSurface(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Quantidade',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline_rounded, color: AppColors.primary),
                      onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                    ),
                    Text(
                      '$_quantity',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primary),
                      onPressed: () => setState(() => _quantity++),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            icon: const Icon(Icons.shopping_cart_rounded),
            label: Text('Adicionar ao carrinho · R\$ ${(product.price * _quantity).toStringAsFixed(2)}'),
            onPressed: () {
              ref.read(cartProvider.notifier).add(product, quantity: _quantity);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${product.name} adicionado ao carrinho')),
              );
              context.push('/cart');
            },
          ),
        ),
      ),
    );
  }
}
