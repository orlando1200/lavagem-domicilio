import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../shop/data/models/payment_model.dart';
import '../../../shop/data/payments_repository.dart';
import '../../../shop/presentation/providers/payment_status_provider.dart';
import '../../data/models/order_model.dart';
import '../../data/orders_repository.dart';
import '../../orders_provider.dart';
import '../widgets/order_tracking_map.dart';

const _terminalStatuses = {'completed', 'cancelled'};

/// Detalhe/acompanhamento de um pedido (GET /orders/:id) — status,
/// estado do pagamento e cancelamento. Pull-to-refresh atualiza tanto
/// o pedido quanto o pagamento.
class OrderDetailPage extends ConsumerStatefulWidget {
  const OrderDetailPage({super.key, required this.orderId});

  final String orderId;

  @override
  ConsumerState<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends ConsumerState<OrderDetailPage> {
  bool _busy = false;
  String? _errorMessage;

  Future<void> _refresh() async {
    ref.invalidate(orderDetailProvider(widget.orderId));
    ref.invalidate(paymentForOrderProvider(widget.orderId));
  }

  Future<void> _cancelOrder() async {
    setState(() {
      _busy = true;
      _errorMessage = null;
    });
    try {
      await ref.read(ordersRepositoryProvider).cancelOrder(widget.orderId);
      if (!mounted) return;
      await _refresh();
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _payNow() async {
    setState(() {
      _busy = true;
      _errorMessage = null;
    });
    try {
      final paymentsRepository = ref.read(paymentsRepositoryProvider);
      final intent = await paymentsRepository.createIntent(
        orderId: widget.orderId,
        method: 'pix',
      );
      if (intent.externalRef != null) {
        await paymentsRepository.confirmMock(intent.externalRef!);
      }
      if (!mounted) return;
      await _refresh();
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resumePayment(String externalRef) async {
    setState(() {
      _busy = true;
      _errorMessage = null;
    });
    try {
      await ref.read(paymentsRepositoryProvider).confirmMock(externalRef);
      if (!mounted) return;
      await _refresh();
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(orderDetailProvider(widget.orderId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Detalhe do Pedido')),
      body: orderAsync.when(
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
                    onPressed: _refresh, child: const Text('Tentar novamente')),
              ],
            ),
          ),
        ),
        data: (order) => RefreshIndicator(
          color: AppColors.primary,
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _OrderSummaryCard(order: order),
              if (order.isTrackable &&
                  order.addressLatitude != null &&
                  order.addressLongitude != null) ...[
                const SizedBox(height: 16),
                OrderTrackingMap(
                  orderId: widget.orderId,
                  addressLatitude: order.addressLatitude!,
                  addressLongitude: order.addressLongitude!,
                ),
              ],
              const SizedBox(height: 16),
              _PaymentSection(
                orderId: widget.orderId,
                busy: _busy,
                onPayNow: _payNow,
                onResumePayment: _resumePayment,
              ),
              if (!_terminalStatuses.contains(order.status)) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _busy ? null : _cancelOrder,
                    style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error),
                    child: _busy
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: AppColors.error),
                          )
                        : const Text('Cancelar pedido'),
                  ),
                ),
              ],
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: AppColors.error),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderSummaryCard extends StatelessWidget {
  const _OrderSummaryCard({required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Pedido #${order.id.substring(0, order.id.length.clamp(0, 8))}',
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'R\$ ${order.totalAmount.toStringAsFixed(2)}',
                style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 16),
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
              order.statusLabel,
              style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentSection extends ConsumerWidget {
  const _PaymentSection({
    required this.orderId,
    required this.busy,
    required this.onPayNow,
    required this.onResumePayment,
  });

  final String orderId;
  final bool busy;
  final VoidCallback onPayNow;
  final ValueChanged<String> onResumePayment;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paymentAsync = ref.watch(paymentForOrderProvider(orderId));

    return paymentAsync.when(
      loading: () => const NeonSurface(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Center(
            child: SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: AppColors.primary),
            ),
          ),
        ),
      ),
      error: (error, stackTrace) => NeonSurface(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Text(
            'Não foi possível carregar o pagamento.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ),
      data: (payment) => _PaymentCard(
        payment: payment,
        busy: busy,
        onPayNow: onPayNow,
        onResumePayment: onResumePayment,
      ),
    );
  }
}

class _PaymentCard extends StatelessWidget {
  const _PaymentCard({
    required this.payment,
    required this.busy,
    required this.onPayNow,
    required this.onResumePayment,
  });

  final PaymentModel? payment;
  final bool busy;
  final VoidCallback onPayNow;
  final ValueChanged<String> onResumePayment;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pagamento',
            style: TextStyle(
                color: AppColors.textPrimary, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          if (payment == null) ...[
            Text(
              'Ainda não há pagamento para este pedido.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: busy ? null : onPayNow,
              child: busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primaryDark),
                    )
                  : const Text('Pagar agora'),
            ),
          ] else if (payment!.status == 'paid') ...[
            Row(
              children: const [
                Icon(Icons.check_circle, color: AppColors.primary, size: 20),
                SizedBox(width: 8),
                Text('Pago',
                    style: TextStyle(
                        color: AppColors.primary, fontWeight: FontWeight.w700)),
              ],
            ),
          ] else if (payment!.status == 'pending') ...[
            Text(
              'Pagamento iniciado mas não confirmado.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: busy || payment!.externalRef == null
                  ? null
                  : () => onResumePayment(payment!.externalRef!),
              child: busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primaryDark),
                    )
                  : const Text('Retomar pagamento'),
            ),
          ] else ...[
            Row(
              children: [
                const Icon(Icons.error_outline,
                    color: AppColors.error, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Pagamento recusado — entre em contato com o suporte.',
                    style: const TextStyle(color: AppColors.error),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
