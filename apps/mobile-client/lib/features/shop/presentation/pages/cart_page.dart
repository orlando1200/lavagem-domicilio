import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../providers/cart_provider.dart';

/// Tela de carrinho / checkout simplificado (mock de pagamento).
class CartPage extends ConsumerWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Carrinho')),
      body: cart.isEmpty
          ? const _CartEmpty()
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: cart.items.length,
              itemBuilder: (context, index) => _CartItemCard(item: cart.items[index]),
            ),
      bottomNavigationBar: cart.isEmpty
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: NeonSurface(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _SummaryRow(label: 'Subtotal', value: cart.subtotal),
                      const SizedBox(height: 6),
                      _SummaryRow(
                        label: 'Frete',
                        value: cart.shipping,
                        highlight: cart.shipping == 0,
                        highlightLabel: 'Grátis',
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        child: Divider(),
                      ),
                      _SummaryRow(label: 'Total', value: cart.total, bold: true),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          onPressed: () => _showMockCheckout(context, ref),
                          child: const Text('Finalizar Compra'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  void _showMockCheckout(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => _MockCheckoutSheet(
        onConfirm: () {
          ref.read(cartProvider.notifier).clear();
          Navigator.of(sheetContext).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Pedido realizado com sucesso!')),
          );
          context.go('/home');
        },
      ),
    );
  }
}

class _MockCheckoutSheet extends StatefulWidget {
  const _MockCheckoutSheet({required this.onConfirm});

  final VoidCallback onConfirm;

  @override
  State<_MockCheckoutSheet> createState() => _MockCheckoutSheetState();
}

class _MockCheckoutSheetState extends State<_MockCheckoutSheet> {
  int _selectedMethod = 0;
  bool _processing = false;

  static const _methods = [
    (icon: Icons.credit_card_rounded, label: 'Cartão de Crédito'),
    (icon: Icons.qr_code_rounded, label: 'Pix'),
    (icon: Icons.account_balance_wallet_rounded, label: 'Carteira GIUCAR'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Forma de pagamento',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Pagamento simulado (mock) para fins de demonstração.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 16),
          for (var i = 0; i < _methods.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                onTap: () => setState(() => _selectedMethod = i),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceAlt,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _selectedMethod == i ? AppColors.primary : AppColors.border,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(_methods[i].icon, color: AppColors.primary),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _methods[i].label,
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                        ),
                      ),
                      Icon(
                        _selectedMethod == i ? Icons.radio_button_checked : Icons.radio_button_off,
                        color: _selectedMethod == i ? AppColors.primary : AppColors.textMuted,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              onPressed: _processing
                  ? null
                  : () async {
                      setState(() => _processing = true);
                      await Future.delayed(const Duration(milliseconds: 900));
                      if (!mounted) return;
                      widget.onConfirm();
                    },
              child: _processing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryDark),
                    )
                  : const Text('Confirmar Pagamento'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.bold = false,
    this.highlight = false,
    this.highlightLabel,
  });

  final String label;
  final double value;
  final bool bold;
  final bool highlight;
  final String? highlightLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: bold ? AppColors.textPrimary : AppColors.textSecondary,
            fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
            fontSize: bold ? 16 : 13,
          ),
        ),
        Text(
          highlight && highlightLabel != null ? highlightLabel! : 'R\$ ${value.toStringAsFixed(2)}',
          style: TextStyle(
            color: bold ? AppColors.primary : (highlight ? AppColors.primary : AppColors.textPrimary),
            fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
            fontSize: bold ? 18 : 13,
          ),
        ),
      ],
    );
  }
}

class _CartItemCard extends ConsumerWidget {
  const _CartItemCard({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.primaryContainer,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Center(
                child: Text(item.product.emoji, style: const TextStyle(fontSize: 24)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.product.name,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'R\$ ${item.product.price.toStringAsFixed(2)}',
                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _QtyButton(
                        icon: Icons.remove_rounded,
                        onTap: () => ref
                            .read(cartProvider.notifier)
                            .updateQuantity(item.product.id, item.quantity - 1),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          '${item.quantity}',
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
                        ),
                      ),
                      _QtyButton(
                        icon: Icons.add_rounded,
                        onTap: () => ref
                            .read(cartProvider.notifier)
                            .updateQuantity(item.product.id, item.quantity + 1),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
              onPressed: () => ref.read(cartProvider.notifier).removeItem(item.product.id),
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, size: 16, color: AppColors.primary),
      ),
    );
  }
}

class _CartEmpty extends StatelessWidget {
  const _CartEmpty();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shopping_cart_outlined, color: AppColors.textMuted, size: 48),
            const SizedBox(height: 12),
            Text(
              'Seu carrinho está vazio.',
              style: TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.push('/shop'),
              child: const Text('Ir para a loja'),
            ),
          ],
        ),
      ),
    );
  }
}
