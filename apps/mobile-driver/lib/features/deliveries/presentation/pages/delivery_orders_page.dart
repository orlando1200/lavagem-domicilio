import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/delivery_order_models.dart';
import '../providers/delivery_orders_provider.dart';

/// Tela de "Entregas da Loja do Lavador".
///
/// O lavador pode fazer entregas de produtos comprados na Loja do
/// Lavador (insumos, equipamentos, repostos): recebe a solicitacao,
/// aceita, faz a rota de coleta na loja/parceiro e entrega ao comprador.
class DeliveryOrdersPage extends ConsumerWidget {
  const DeliveryOrdersPage({super.key});

  String _actionLabel(DeliveryOrderStatus status) {
    switch (status) {
      case DeliveryOrderStatus.accepted:
        return 'Iniciar rota de coleta';
      case DeliveryOrderStatus.onTheWay:
        return 'Confirmar entrega';
      case DeliveryOrderStatus.delivered:
      case DeliveryOrderStatus.pending:
        return 'Finalizar';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(deliveryOrdersProvider);
    final notifier = ref.read(deliveryOrdersProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Entregas da Loja do Lavador')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Entregue produtos comprados por outros lavadores na Loja do Lavador.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 16),
          if (state.activeDelivery != null) ...[
            Text(
              'Entrega em andamento',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 8),
            _ActiveDeliveryCard(
              delivery: state.activeDelivery!,
              actionLabel: _actionLabel(state.activeDelivery!.status),
              onAdvance: () {
                notifier.advanceActiveDeliveryStatus();
                if (ref.read(deliveryOrdersProvider).activeDelivery == null && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Entrega concluída!')),
                  );
                }
              },
              onCancel: notifier.cancelActiveDelivery,
            ),
            const SizedBox(height: 20),
          ],
          Text(
            'Entregas pendentes',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
          ),
          const SizedBox(height: 8),
          if (state.pendingDeliveries.isEmpty)
            const _EmptyDeliveriesState()
          else
            ...state.pendingDeliveries.map(
              (delivery) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PendingDeliveryCard(
                  delivery: delivery,
                  onAccept: () => notifier.acceptDelivery(delivery.id),
                  onReject: () => notifier.rejectDelivery(delivery.id),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ActiveDeliveryCard extends StatelessWidget {
  const _ActiveDeliveryCard({
    required this.delivery,
    required this.actionLabel,
    required this.onAdvance,
    required this.onCancel,
  });

  final DeliveryOrder delivery;
  final String actionLabel;
  final VoidCallback onAdvance;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
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
                    delivery.productName,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                  ),
                ),
                Text(
                  'R\$ ${delivery.fee.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.primary),
              ),
              child: Text(
                delivery.status.label,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(height: 10),
            _DeliveryDetailLine(icon: Icons.storefront_outlined, text: '${delivery.storeName} · ${delivery.buyerName}'),
            const SizedBox(height: 4),
            _DeliveryDetailLine(icon: Icons.inventory_2_outlined, text: 'Coleta: ${delivery.pickupAddress}'),
            const SizedBox(height: 4),
            _DeliveryDetailLine(
              icon: Icons.location_on_outlined,
              text: 'Entrega: ${delivery.deliveryAddress} · ${delivery.distanceKm} km',
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: onAdvance,
                    child: Text(actionLabel),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: onCancel,
                    child: const Text('Cancelar'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingDeliveryCard extends StatelessWidget {
  const _PendingDeliveryCard({
    required this.delivery,
    required this.onAccept,
    required this.onReject,
  });

  final DeliveryOrder delivery;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
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
                    delivery.productName,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                  ),
                ),
                Text(
                  'R\$ ${delivery.fee.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _DeliveryDetailLine(icon: Icons.storefront_outlined, text: '${delivery.storeName} · ${delivery.buyerName}'),
            const SizedBox(height: 4),
            _DeliveryDetailLine(icon: Icons.inventory_2_outlined, text: 'Coleta: ${delivery.pickupAddress}'),
            const SizedBox(height: 4),
            _DeliveryDetailLine(
              icon: Icons.location_on_outlined,
              text: 'Entrega: ${delivery.deliveryAddress} · ${delivery.distanceKm} km',
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: onAccept,
                    child: const Text('Aceitar'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: onReject,
                    child: const Text('Recusar'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DeliveryDetailLine extends StatelessWidget {
  const _DeliveryDetailLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ),
      ],
    );
  }
}

class _EmptyDeliveriesState extends StatelessWidget {
  const _EmptyDeliveriesState();

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.local_shipping_outlined, color: AppColors.textMuted, size: 32),
            const SizedBox(height: 8),
            Text(
              'Nenhuma entrega pendente no momento.',
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
