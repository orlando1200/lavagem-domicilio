import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../providers/driver_orders_provider.dart';

/// Tela de pedido ativo do lavador.
///
/// Exibe os dados do pedido em andamento e permite avancar pelas etapas
/// do fluxo (atribuido -> a caminho -> chegou -> em andamento -> concluido),
/// seguindo a identidade visual GIUCAR Cyberpunk.
class ActiveOrderPage extends ConsumerWidget {
  const ActiveOrderPage({super.key});

  String _actionLabel(DriverOrderStatus status) {
    switch (status) {
      case DriverOrderStatus.assigned:
        return 'Iniciar deslocamento';
      case DriverOrderStatus.onTheWay:
        return 'Cheguei ao local';
      case DriverOrderStatus.arrived:
        return 'Iniciar lavagem';
      case DriverOrderStatus.inProgress:
        return 'Concluir lavagem';
      case DriverOrderStatus.completed:
      case DriverOrderStatus.pending:
      case DriverOrderStatus.cancelled:
        return 'Finalizar';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(driverOrdersProvider).activeOrder;

    if (order == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Pedido ativo')),
        body: Center(
          child: Text(
            'Nenhum pedido em andamento',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Pedido ativo')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          NeonSurface(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        order.customerName,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                      ),
                      Text(
                        'R\$ ${order.price.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.primary),
                    ),
                    child: Text(
                      order.status.label,
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _DetailRow(icon: Icons.directions_car_rounded, label: order.serviceName, value: order.vehicle),
                  const SizedBox(height: 10),
                  _DetailRow(
                    icon: Icons.location_on_outlined,
                    label: order.address,
                    value: order.distanceKm != null ? '${order.distanceKm} km' : '',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _StatusTimeline(currentStatus: order.status),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () async {
              await ref.read(driverOrdersProvider.notifier).advanceActiveOrderStatus();
              final updated = ref.read(driverOrdersProvider).activeOrder;
              if (updated == null && context.mounted) {
                context.pop();
              }
            },
            child: Text(_actionLabel(order.status)),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () async {
              await ref.read(driverOrdersProvider.notifier).cancelActiveOrder();
              if (context.mounted) context.pop();
            },
            child: const Text('Cancelar pedido'),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }
}

class _StatusTimeline extends StatelessWidget {
  const _StatusTimeline({required this.currentStatus});

  final DriverOrderStatus currentStatus;

  static const _steps = [
    DriverOrderStatus.assigned,
    DriverOrderStatus.onTheWay,
    DriverOrderStatus.arrived,
    DriverOrderStatus.inProgress,
    DriverOrderStatus.completed,
  ];

  @override
  Widget build(BuildContext context) {
    final currentIndex = _steps.indexOf(currentStatus);

    return NeonSurface(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Andamento',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 14),
            ...List.generate(_steps.length, (i) {
              final step = _steps[i];
              final done = currentIndex >= 0 && i <= currentIndex;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: done ? AppColors.primary : AppColors.surfaceAlt,
                        border: Border.all(color: done ? AppColors.primary : AppColors.border),
                      ),
                      child: done
                          ? const Icon(Icons.check_rounded, size: 14, color: AppColors.primaryDark)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      step.label,
                      style: TextStyle(
                        color: done ? AppColors.textPrimary : AppColors.textMuted,
                        fontWeight: done ? FontWeight.w700 : FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
