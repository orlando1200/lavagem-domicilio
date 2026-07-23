import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/widgets/loading_skeleton.dart';
import '../../../core/widgets/neon_surface.dart';
import '../../quote/presentation/providers/quote_provider.dart';
import '../../vehicles/presentation/providers/vehicles_provider.dart';
import '../../addresses/presentation/providers/addresses_provider.dart';
import '../data/repositories/order_repository.dart';
import '../data/models/order_models.dart';

final checkoutPaymentMethodProvider = StateProvider<String>((ref) => 'pix');
final checkoutLoadingProvider = StateProvider<bool>((ref) => false);

class QuoteCheckoutPage extends ConsumerWidget {
  const QuoteCheckoutPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quote = ref.watch(currentQuoteProvider);
    final selectedVehicleId = ref.watch(selectedVehicleIdProvider);
    final selectedAddressId = ref.watch(selectedAddressIdProvider);
    final vehicles = ref.watch(vehiclesProvider);
    final addresses = ref.watch(addressesProvider);
    final paymentMethod = ref.watch(checkoutPaymentMethodProvider);
    final isLoading = ref.watch(checkoutLoadingProvider);

    final vehicle = vehicles.valueOrNull
        ?.firstWhere((v) => v.id == selectedVehicleId, orElse: () => null as dynamic);
    final address = addresses.valueOrNull
        ?.firstWhere((a) => a.id == selectedAddressId, orElse: () => null as dynamic);

    if (quote == null || vehicle == null || address == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: const Center(
          child: Text('Cotação inválida. Volte e calcule novamente.'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Confirmar pedido')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            NeonSurface(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Resumo',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    ...quote.items.map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(item.serviceName),
                              Text(
                                'R\$ ${item.totalPrice.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        )),
                    const Divider(),
                    _CheckoutLine(
                      label: 'Subtotal',
                      value: 'R\$ ${quote.subtotal.toStringAsFixed(2)}',
                    ),
                    if (quote.distanceFee > 0)
                      _CheckoutLine(
                        label: 'Deslocamento (${quote.distanceKm.toStringAsFixed(1)} km)',
                        value: 'R\$ ${quote.distanceFee.toStringAsFixed(2)}',
                      ),
                    if (quote.surgeAmount > 0)
                      _CheckoutLine(
                        label: 'Preço dinâmico x${quote.surgeMultiplier.toStringAsFixed(2)}',
                        value: 'R\$ ${quote.surgeAmount.toStringAsFixed(2)}',
                        valueColor: Colors.orange,
                      ),
                    if (quote.discountAmount > 0)
                      _CheckoutLine(
                        label: 'Desconto',
                        value: '- R\$ ${quote.discountAmount.toStringAsFixed(2)}',
                        valueColor: Colors.green,
                      ),
                    const Divider(),
                    _CheckoutLine(
                      label: 'Total',
                      value: 'R\$ ${quote.totalAmount.toStringAsFixed(2)}',
                      isBold: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            NeonSurface(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Veículo e endereço',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    _InfoRow(icon: Icons.directions_car, text: '${vehicle.brand} ${vehicle.model} (${vehicle.plate})'),
                    const SizedBox(height: 8),
                    _InfoRow(icon: Icons.location_on, text: '${address.street}, ${address.number} - ${address.neighborhood}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            NeonSurface(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Forma de pagamento',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'pix', label: Text('PIX')),
                        ButtonSegment(value: 'credit_card', label: Text('Cartão')),
                        ButtonSegment(value: 'cash', label: Text('Dinheiro')),
                      ],
                      selected: {paymentMethod},
                      onSelectionChanged: (selection) {
                        ref.read(checkoutPaymentMethodProvider.notifier).state =
                            selection.first;
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: isLoading
                  ? null
                  : () => _createOrder(context, ref, quote.quoteId, vehicle.id, address.id, paymentMethod),
              child: isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Confirmar pedido'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _createOrder(
    BuildContext context,
    WidgetRef ref,
    String quoteId,
    String vehicleId,
    String addressId,
    String paymentMethod,
  ) async {
    ref.read(checkoutLoadingProvider.notifier).state = true;
    try {
      final quote = ref.read(currentQuoteProvider);
      if (quote == null) return;

      final request = CreateOrderRequest(
        serviceIds: quote.items.map((i) => i.serviceId).toList(),
        vehicleId: vehicleId,
        addressId: addressId,
        paymentMethod: paymentMethod,
        scheduledAt: quote.scheduledFor,
      );

      final order = await ref.read(orderRepositoryProvider).createOrder(request);
      if (!context.mounted) return;

      if (paymentMethod == 'pix' && order.pixCode != null) {
        context.push('/orders/${order.id}/payment');
      } else {
        context.go('/orders/${order.id}');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao criar pedido: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      ref.read(checkoutLoadingProvider.notifier).state = false;
    }
  }
}

class _CheckoutLine extends StatelessWidget {
  const _CheckoutLine({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final style = (isBold
            ? Theme.of(context).textTheme.titleMedium
            : Theme.of(context).textTheme.bodyMedium)
        ?.copyWith(fontWeight: isBold ? FontWeight.bold : FontWeight.normal);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: style),
          Text(value, style: style?.copyWith(color: valueColor)),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(text)),
      ],
    );
  }
}

