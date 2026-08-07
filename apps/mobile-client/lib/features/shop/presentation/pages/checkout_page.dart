import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/marketplace_repository.dart';
import '../../data/models/product_order_model.dart';
import '../../data/models/shipping_address.dart';
import '../../data/payments_repository.dart';
import '../providers/cart_provider.dart';

/// Checkout real: endereco de entrega -> criacao dos ProductOrder
/// (um por loja) -> pagamento (mock) de cada um.
class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({super.key});

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  final _formKey = GlobalKey<FormState>();
  final _streetController = TextEditingController();
  final _numberController = TextEditingController();
  final _complementController = TextEditingController();
  final _neighborhoodController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipCodeController = TextEditingController();

  int _step = 0;
  int _selectedMethod = 0;
  bool _submitting = false;
  String? _errorMessage;
  List<ProductOrderModel>? _createdOrders;

  static const _methods = [
    (icon: Icons.qr_code_rounded, label: 'Pix', value: 'pix'),
    (icon: Icons.credit_card_rounded, label: 'Cartão de Crédito', value: 'credit_card'),
  ];

  @override
  void dispose() {
    _streetController.dispose();
    _numberController.dispose();
    _complementController.dispose();
    _neighborhoodController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipCodeController.dispose();
    super.dispose();
  }

  Future<void> _submitAddress() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    final address = ShippingAddress(
      street: _streetController.text.trim(),
      number: _numberController.text.trim(),
      complement: _complementController.text.trim(),
      neighborhood: _neighborhoodController.text.trim(),
      city: _cityController.text.trim(),
      state: _stateController.text.trim().toUpperCase(),
      zipCode: _zipCodeController.text.trim(),
    );

    try {
      final cart = ref.read(cartProvider);
      final orders = await ref.read(marketplaceRepositoryProvider).checkout(
            items: cart.items,
            address: address,
          );
      if (!mounted) return;
      setState(() {
        _createdOrders = orders;
        _step = 1;
      });
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _confirmPayment() async {
    final orders = _createdOrders;
    if (orders == null || orders.isEmpty) return;

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final paymentsRepository = ref.read(paymentsRepositoryProvider);
      final method = _methods[_selectedMethod].value;
      for (final order in orders) {
        final intent = await paymentsRepository.createIntent(
          productOrderId: order.id,
          method: method,
        );
        if (intent.externalRef != null) {
          await paymentsRepository.confirmMock(intent.externalRef!);
        }
      }

      if (!mounted) return;
      ref.read(cartProvider.notifier).clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pedido realizado com sucesso!')),
      );
      context.go('/home');
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Finalizar Compra')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _step == 0 ? 'Passo 1 de 2 · Endereço de entrega' : 'Passo 2 de 2 · Pagamento',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 16),
              if (_step == 0) _AddressStep(
                formKey: _formKey,
                streetController: _streetController,
                numberController: _numberController,
                complementController: _complementController,
                neighborhoodController: _neighborhoodController,
                cityController: _cityController,
                stateController: _stateController,
                zipCodeController: _zipCodeController,
                submitting: _submitting,
                onContinue: _submitAddress,
              ) else _PaymentStep(
                orders: _createdOrders ?? const [],
                methods: _methods,
                selectedMethod: _selectedMethod,
                onSelect: (i) => setState(() => _selectedMethod = i),
                submitting: _submitting,
                onConfirm: _confirmPayment,
              ),
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

class _AddressStep extends StatelessWidget {
  const _AddressStep({
    required this.formKey,
    required this.streetController,
    required this.numberController,
    required this.complementController,
    required this.neighborhoodController,
    required this.cityController,
    required this.stateController,
    required this.zipCodeController,
    required this.submitting,
    required this.onContinue,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController streetController;
  final TextEditingController numberController;
  final TextEditingController complementController;
  final TextEditingController neighborhoodController;
  final TextEditingController cityController;
  final TextEditingController stateController;
  final TextEditingController zipCodeController;
  final bool submitting;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: streetController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Rua'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe a rua' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: numberController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Número'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Obrigatório' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: complementController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Complemento (opcional)'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: neighborhoodController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Bairro'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o bairro' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: cityController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Cidade'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Obrigatório' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: stateController,
                    maxLength: 2,
                    textCapitalization: TextCapitalization.characters,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'UF', counterText: ''),
                    validator: (v) => (v == null || v.trim().length != 2) ? 'UF' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: zipCodeController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'CEP'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o CEP' : null,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: submitting ? null : onContinue,
              child: submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryDark),
                    )
                  : const Text('Continuar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentStep extends StatelessWidget {
  const _PaymentStep({
    required this.orders,
    required this.methods,
    required this.selectedMethod,
    required this.onSelect,
    required this.submitting,
    required this.onConfirm,
  });

  final List<ProductOrderModel> orders;
  final List<({IconData icon, String label, String value})> methods;
  final int selectedMethod;
  final ValueChanged<int> onSelect;
  final bool submitting;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    final total = orders.fold<double>(0, (sum, o) => sum + o.totalAmount);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        NeonSurface(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Pedido confirmado',
                style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                '${orders.length} ${orders.length == 1 ? 'pedido' : 'pedidos'} · Total R\$ ${total.toStringAsFixed(2)}',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Forma de pagamento',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 16),
        ),
        const SizedBox(height: 4),
        Text(
          'Sem chaves de gateway real configuradas — pagamento confirmado em modo mock.',
          style: TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
        const SizedBox(height: 12),
        for (var i = 0; i < methods.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              onTap: () => onSelect(i),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: selectedMethod == i ? AppColors.primary : AppColors.border,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(methods[i].icon, color: AppColors.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        methods[i].label,
                        style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Icon(
                      selectedMethod == i ? Icons.radio_button_checked : Icons.radio_button_off,
                      color: selectedMethod == i ? AppColors.primary : AppColors.textMuted,
                    ),
                  ],
                ),
              ),
            ),
          ),
        const SizedBox(height: 8),
        FilledButton(
          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
          onPressed: submitting ? null : onConfirm,
          child: submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryDark),
                )
              : const Text('Confirmar Pagamento'),
        ),
      ],
    );
  }
}
