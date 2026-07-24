import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/store_product.dart';
import '../../products_provider.dart';

/// Tela "Meus produtos": agrupa por status (pendentes, ativos, rejeitados),
/// conectada a GET /stores/:id/products.
class ProductsListPage extends ConsumerWidget {
  const ProductsListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(storeProductsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Meus produtos')),
      body: SafeArea(
        child: productsAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          error: (error, stackTrace) => _ProductsError(
            message: error.toString(),
            onRetry: () => ref.invalidate(storeProductsProvider),
          ),
          data: (products) {
            final pending = products.where((p) => p.uiStatus == ProductStatus.pendente).toList();
            final active = products.where((p) => p.uiStatus == ProductStatus.ativo).toList();
            final rejected = products.where((p) => p.uiStatus == ProductStatus.rejeitado).toList();

            return RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async => ref.invalidate(storeProductsProvider),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                children: [
                  Text(
                    'Gerencie seus anúncios',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 16),
                  if (products.isEmpty) const _ProductsEmpty(),
                  if (pending.isNotEmpty) ...[
                    _SectionTitle('Pendentes de aprovação'),
                    ...pending.map((p) => _ProductCard(product: p)),
                  ],
                  if (active.isNotEmpty) ...[
                    _SectionTitle('Ativos'),
                    ...active.map((p) => _ProductCard(product: p)),
                  ],
                  if (rejected.isNotEmpty) ...[
                    _SectionTitle('Rejeitados'),
                    ...rejected.map((p) => _ProductCard(product: p)),
                  ],
                  const SizedBox(height: 8),
                  FilledButton.icon(
                    onPressed: () async {
                      await context.push('/products/new');
                      ref.invalidate(storeProductsProvider);
                    },
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('Novo produto'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ProductsEmpty extends StatelessWidget {
  const _ProductsEmpty();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          const Icon(Icons.inventory_2_outlined, color: AppColors.textMuted, size: 44),
          const SizedBox(height: 12),
          Text(
            'Você ainda não cadastrou produtos.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ProductsError extends StatelessWidget {
  const _ProductsError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, color: AppColors.error, size: 48),
            const SizedBox(height: 12),
            Text(
              message,
              style: const TextStyle(color: AppColors.error),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Tentar novamente')),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 4),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppColors.accentAlt,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});

  final StoreProduct product;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    product.name,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                  ),
                ),
                _StatusBadge(status: product.uiStatus),
              ],
            ),
            const SizedBox(height: 6),
            if (product.uiStatus == ProductStatus.rejeitado)
              Text(
                'Motivo: ${product.rejectionReason ?? '-'}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              )
            else
              Text(
                'R\$ ${product.price.toStringAsFixed(2)} · ${product.catalogTarget.label} · ${product.stockQuantity} un',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final ProductStatus status;

  @override
  Widget build(BuildContext context) {
    final Color color = switch (status) {
      ProductStatus.pendente => AppColors.accentAlt,
      ProductStatus.ativo => AppColors.primary,
      ProductStatus.rejeitado => AppColors.error,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.label.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: color,
        ),
      ),
    );
  }
}
