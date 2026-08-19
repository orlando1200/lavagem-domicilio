import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/product_model.dart';
import '../../shop_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/compatibility_badge.dart';

/// Tela de detalhe do produto da loja B2C (GET /marketplace/products/:id).
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
    final productAsync = ref.watch(productDetailProvider(widget.productId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Produto')),
      body: productAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  error.toString(),
                  style: const TextStyle(color: AppColors.error),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => ref.invalidate(productDetailProvider(widget.productId)),
                  child: const Text('Tentar novamente'),
                ),
              ],
            ),
          ),
        ),
        data: (product) => _ProductDetailBody(
          product: product,
          quantity: _quantity,
          onIncrement: () => setState(() => _quantity++),
          onDecrement: _quantity > 1 ? () => setState(() => _quantity--) : null,
        ),
      ),
    );
  }
}

class _ProductDetailBody extends ConsumerWidget {
  const _ProductDetailBody({
    required this.product,
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
  });

  final ProductModel product;
  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback? onDecrement;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color = product.id.hashCode.isEven ? AppColors.primary : AppColors.accent;

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Center(
                child: Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(color: AppColors.glow, blurRadius: 32, spreadRadius: -6),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      product.initial,
                      style: TextStyle(fontSize: 64, fontWeight: FontWeight.w800, color: color),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              if (product.category != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.accentContainer,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppColors.accent),
                  ),
                  child: Text(
                    product.category!,
                    style: const TextStyle(
                      color: AppColors.accentAlt,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      product.name,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  CompatibilityBadge(compatibility: product.compatibility),
                ],
              ),
              if (product.storeName != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Vendido por ${product.storeName}',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
              ],
              const SizedBox(height: 16),
              Text(
                'R\$ ${product.price.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (!product.inStock) ...[
                const SizedBox(height: 8),
                const Text(
                  'Produto esgotado no momento.',
                  style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700),
                ),
              ],
              if (product.description != null) ...[
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
                        product.description!,
                        style: TextStyle(color: AppColors.textSecondary, height: 1.5),
                      ),
                    ],
                  ),
                ),
              ],
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
                          onPressed: onDecrement,
                        ),
                        Text(
                          '$quantity',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primary),
                          onPressed: quantity < product.stockQuantity ? onIncrement : null,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              icon: const Icon(Icons.shopping_cart_rounded),
              label: Text(
                'Adicionar ao carrinho · R\$ ${(product.price * quantity).toStringAsFixed(2)}',
              ),
              onPressed: !product.inStock
                  ? null
                  : () async {
                      if (!await confirmAddIfNotCompatible(context, product)) return;
                      if (!context.mounted) return;
                      ref.read(cartProvider.notifier).add(product, quantity: quantity);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('${product.name} adicionado ao carrinho')),
                      );
                      context.push('/cart');
                    },
            ),
          ),
        ),
      ],
    );
  }
}
