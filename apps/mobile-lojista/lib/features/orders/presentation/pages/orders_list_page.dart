import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/store_order_model.dart';
import '../../orders_provider.dart';

/// Tela "Pedidos": todos os pedidos de produto recebidos pela loja
/// (GET /stores/:id/orders), sem o corte de 5 itens da home.
class OrdersListPage extends ConsumerWidget {
  const OrdersListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(storeOrdersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Pedidos')),
      body: SafeArea(
        child: ordersAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          error: (error, stackTrace) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.wifi_off_rounded,
                      color: AppColors.error, size: 48),
                  const SizedBox(height: 12),
                  Text(
                    error.toString(),
                    style: const TextStyle(color: AppColors.error),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => ref.invalidate(storeOrdersProvider),
                    child: const Text('Tentar novamente'),
                  ),
                ],
              ),
            ),
          ),
          data: (orders) {
            if (orders.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.receipt_long_outlined,
                          color: AppColors.textMuted, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        'Nenhum pedido recebido ainda.',
                        style: TextStyle(color: AppColors.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }
            return RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async => ref.invalidate(storeOrdersProvider),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: orders.length,
                itemBuilder: (context, index) =>
                    _OrderCard(order: orders[index]),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});

  final StoreOrderModel order;

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
                    order.itemsSummary,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                  ),
                ),
                Text(
                  'R\$ ${order.totalAmount.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              order.buyerName ?? 'Pedido ${order.orderNumber}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              'Status: ${order.statusLabel}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.accentAlt,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
