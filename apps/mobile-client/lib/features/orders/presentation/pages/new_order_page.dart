import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../addresses/data/models/address_model.dart';
import '../../../addresses/presentation/providers/addresses_provider.dart';
import '../../../vehicles/data/models/vehicle_model.dart';
import '../../../vehicles/presentation/providers/vehicles_provider.dart';
import '../../../shop/data/payments_repository.dart';
import '../../data/models/order_model.dart';
import '../../data/models/wash_price_model.dart';
import '../../data/orders_repository.dart';
import '../../data/wash_pricing_repository.dart';
import '../../orders_provider.dart';

typedef _WashService = ({
  String serviceType,
  String name,
  double price,
  IconData icon,
  bool isAuction,
});

const _heavyService = (
  serviceType: 'HEAVY_SERVICE',
  name: 'Serviço Pesado (Leilão)',
  price: 0.0,
  icon: Icons.gavel_rounded,
  isAuction: true,
);

/// Matriz de precos ativa — Servicos Auto / Lavagem por Tamanho
/// (GET /wash-pricing/matrix).
final _washMatrixProvider = FutureProvider<List<WashPriceEntry>>((ref) {
  return ref.watch(washPricingRepositoryProvider).fetchMatrix();
});

typedef _PaymentMethod = ({IconData icon, String label, String value});

const _methods = <_PaymentMethod>[
  (icon: Icons.qr_code_rounded, label: 'Pix', value: 'pix'),
  (
    icon: Icons.credit_card_rounded,
    label: 'Cartão de Crédito',
    value: 'credit_card'
  ),
];

/// Wizard de novo pedido de lavagem: servico -> veiculo -> endereco ->
/// revisao -> pagamento. Mesma logica imperativa (setState +
/// try/catch/finally) do checkout de marketplace em
/// `checkout_page.dart`, so que com mais passos.
///
/// `HEAVY_SERVICE` segue o mesmo caminho ate a revisao, mas sem preco
/// fixo nem pagamento — ao confirmar, cria o pedido `pending` e leva
/// direto pra `/auctions/new` (fluxo de leilao ja existente, que lista
/// os pedidos `pending` do cliente pra abrir o leilao).
class NewOrderPage extends ConsumerStatefulWidget {
  const NewOrderPage({super.key});

  @override
  ConsumerState<NewOrderPage> createState() => _NewOrderPageState();
}

class _NewOrderPageState extends ConsumerState<NewOrderPage> {
  int _step = 0;
  _WashService? _selectedService;
  VehicleModel? _selectedVehicle;
  AddressModel? _selectedAddress;
  int _selectedMethod = 0;
  bool _submitting = false;
  String? _errorMessage;
  OrderModel? _createdOrder;

  static const _stepTitles = [
    'Passo 1 de 4 · Serviço',
    'Passo 2 de 4 · Veículo',
    'Passo 3 de 4 · Endereço',
    'Passo 4 de 4 · Revisão',
    'Pagamento',
  ];

  Future<void> _addVehicle() async {
    final created = await context.push<bool>('/vehicles/new');
    if (created == true) {
      ref.invalidate(vehiclesProvider);
    }
  }

  Future<void> _addAddress() async {
    final created = await context.push<bool>('/addresses/new');
    if (created == true) {
      ref.invalidate(addressesProvider);
    }
  }

  Future<void> _submitOrder() async {
    final service = _selectedService;
    final vehicle = _selectedVehicle;
    final address = _selectedAddress;
    if (service == null || vehicle == null || address == null) return;

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final order = await ref.read(ordersRepositoryProvider).createOrder(
            vehicleId: vehicle.id,
            addressId: address.id,
            serviceType: service.serviceType,
            items: service.isAuction
                ? [
                    {
                      'name': 'Serviço pesado — preço definido no leilão',
                      'price': 0,
                      'quantity': 1,
                    },
                  ]
                : [
                    {
                      'name': service.name,
                      'price': service.price,
                      'quantity': 1
                    },
                  ],
          );
      if (!mounted) return;
      if (service.isAuction) {
        // HEAVY_SERVICE fica `pending` (nunca passa pelo matching normal)
        // — /auctions/new le os pedidos `pending` do cliente pra abrir o
        // leilao, entao so precisamos invalidar a lista antes de navegar.
        ref.invalidate(myOrdersProvider);
        context.go('/auctions/new');
        return;
      }
      setState(() {
        _createdOrder = order;
        _step = 4;
      });
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _confirmPayment() async {
    final order = _createdOrder;
    if (order == null) return;

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final paymentsRepository = ref.read(paymentsRepositoryProvider);
      final intent = await paymentsRepository.createIntent(
        orderId: order.id,
        method: _methods[_selectedMethod].value,
      );
      if (intent.externalRef != null) {
        await paymentsRepository.confirmMock(intent.externalRef!);
      }
      if (!mounted) return;
      context.go('/orders/${order.id}');
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
      appBar: AppBar(title: const Text('Solicitar Lavagem')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _stepTitles[_step],
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 16),
              if (_step == 0)
                _ServiceStep(
                  onSelect: (service) => setState(() {
                    _selectedService = service;
                    _step = 1;
                  }),
                )
              else if (_step == 1)
                _VehicleStep(
                    onAddVehicle: _addVehicle,
                    onSelect: (v) => setState(() {
                          _selectedVehicle = v;
                          _step = 2;
                        }))
              else if (_step == 2)
                _AddressStep(
                    onAddAddress: _addAddress,
                    onSelect: (a) => setState(() {
                          _selectedAddress = a;
                          _step = 3;
                        }))
              else if (_step == 3)
                _ReviewStep(
                  service: _selectedService!,
                  vehicle: _selectedVehicle!,
                  address: _selectedAddress!,
                  submitting: _submitting,
                  onConfirm: _submitOrder,
                )
              else
                _PaymentStep(
                  totalAmount: _createdOrder!.totalAmount,
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
                if (_step == 3) ...[
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => context.push('/orders'),
                    child: const Text('Ver meus pedidos'),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Passo 1 do wizard: Lavagem por Tamanho (Servicos Auto) — tamanho +
/// tipo, preco calculado pela matriz — ou Servico Pesado (leilao,
/// inalterado). Tamanho e pre-selecionado a partir do primeiro veiculo
/// salvo que tiver `size` definido; sempre editavel manualmente.
class _ServiceStep extends ConsumerStatefulWidget {
  const _ServiceStep({required this.onSelect});

  final ValueChanged<_WashService> onSelect;

  @override
  ConsumerState<_ServiceStep> createState() => _ServiceStepState();
}

class _ServiceStepState extends ConsumerState<_ServiceStep> {
  CarSize? _size;
  WashType? _washType;
  bool _sizePreselected = false;

  @override
  Widget build(BuildContext context) {
    final matrixAsync = ref.watch(_washMatrixProvider);
    final vehiclesAsync = ref.watch(vehiclesProvider);

    if (!_sizePreselected) {
      final vehicles = vehiclesAsync.valueOrNull;
      if (vehicles != null) {
        _sizePreselected = true;
        final withSize = vehicles.where((v) => v.size != null).toList();
        if (withSize.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => _size = withSize.first.size);
          });
        }
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Lavagem',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 16),
        ),
        const SizedBox(height: 10),
        matrixAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
          ),
          error: (error, _) => Text(
            'Não foi possível carregar os preços de lavagem.',
            style: const TextStyle(color: AppColors.error),
          ),
          data: (matrix) => _LavagemSelector(
            matrix: matrix,
            size: _size,
            washType: _washType,
            onSizeChanged: (s) => setState(() {
              _size = s;
              _washType = null;
            }),
            onWashTypeChanged: (wt) => setState(() => _washType = wt),
            onContinue: (price, label) => widget.onSelect((
              serviceType: 'DRY_WASH',
              name: label,
              price: price,
              icon: Icons.local_car_wash,
              isAuction: false,
            )),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'ou',
          style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        NeonSurface(
          child: InkWell(
            onTap: () => widget.onSelect(_heavyService),
            borderRadius: BorderRadius.circular(20),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(_heavyService.icon, color: AppColors.primary, size: 28),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      _heavyService.name,
                      style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const Text(
                    'A definir em leilão',
                    style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

const Map<CarSize, String> _carSizeLabels = {
  CarSize.PEQUENO: 'Pequeno / Hatch',
  CarSize.MEDIO: 'Médio / Sedã',
  CarSize.GRANDE: 'Grande / SUV',
};

class _LavagemSelector extends StatelessWidget {
  const _LavagemSelector({
    required this.matrix,
    required this.size,
    required this.washType,
    required this.onSizeChanged,
    required this.onWashTypeChanged,
    required this.onContinue,
  });

  final List<WashPriceEntry> matrix;
  final CarSize? size;
  final WashType? washType;
  final ValueChanged<CarSize> onSizeChanged;
  final ValueChanged<WashType> onWashTypeChanged;
  final void Function(double price, String label) onContinue;

  @override
  Widget build(BuildContext context) {
    final availableTypes = size == null
        ? const <WashPriceEntry>[]
        : matrix.where((e) => e.carSize == size).toList();
    WashPriceEntry? selectedEntry;
    if (washType != null) {
      for (final entry in availableTypes) {
        if (entry.washType == washType) selectedEntry = entry;
      }
    }

    return NeonSurface(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Tamanho do veículo', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final s in CarSize.values)
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: s == CarSize.values.last ? 0 : 8),
                    child: InkWell(
                      onTap: () => onSizeChanged(s),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                        decoration: BoxDecoration(
                          color: size == s ? AppColors.primaryContainer : AppColors.surfaceAlt,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: size == s ? AppColors.primary : AppColors.border),
                        ),
                        child: Text(
                          _carSizeLabels[s]!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: size == s ? AppColors.primary : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          if (size != null) ...[
            const SizedBox(height: 16),
            Text('Tipo de lavagem', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (availableTypes.isEmpty)
              Text(
                'Nenhum preço cadastrado pra esse tamanho ainda.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              )
            else
              for (final entry in availableTypes)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () => onWashTypeChanged(entry.washType),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                      decoration: BoxDecoration(
                        color: washType == entry.washType ? AppColors.primaryContainer : AppColors.surfaceAlt,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: washType == entry.washType ? AppColors.primary : AppColors.border,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              entry.washType.label,
                              style: TextStyle(
                                color: washType == entry.washType ? AppColors.primary : AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          Text(
                            'R\$ ${entry.price.toStringAsFixed(2)}',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
          ],
          if (selectedEntry != null) ...[
            const SizedBox(height: 12),
            Builder(
              builder: (context) {
                final entry = selectedEntry!;
                return SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => onContinue(
                      entry.price,
                      'Lavagem ${entry.washType.label} — ${_carSizeLabels[entry.carSize]}',
                    ),
                    child: Text('Continuar · R\$ ${entry.price.toStringAsFixed(2)}'),
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _VehicleStep extends ConsumerWidget {
  const _VehicleStep({required this.onAddVehicle, required this.onSelect});

  final VoidCallback onAddVehicle;
  final ValueChanged<VehicleModel> onSelect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehiclesAsync = ref.watch(vehiclesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        vehiclesAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(
                child: CircularProgressIndicator(color: AppColors.primary)),
          ),
          error: (error, stackTrace) => Text(
            error.toString(),
            style: const TextStyle(color: AppColors.error),
          ),
          data: (vehicles) {
            if (vehicles.isEmpty) {
              return Text(
                'Você ainda não tem veículos cadastrados.',
                style: TextStyle(color: AppColors.textSecondary),
              );
            }
            return Column(
              children: [
                for (final vehicle in vehicles)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: NeonSurface(
                      child: InkWell(
                        onTap: () => onSelect(vehicle),
                        borderRadius: BorderRadius.circular(20),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              const Icon(Icons.directions_car,
                                  color: AppColors.primary),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Text(
                                  vehicle.displayName,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: onAddVehicle,
          icon: const Icon(Icons.add),
          label: const Text('Adicionar veículo'),
        ),
      ],
    );
  }
}

class _AddressStep extends ConsumerWidget {
  const _AddressStep({required this.onAddAddress, required this.onSelect});

  final VoidCallback onAddAddress;
  final ValueChanged<AddressModel> onSelect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesAsync = ref.watch(addressesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        addressesAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(
                child: CircularProgressIndicator(color: AppColors.primary)),
          ),
          error: (error, stackTrace) => Text(
            error.toString(),
            style: const TextStyle(color: AppColors.error),
          ),
          data: (addresses) {
            if (addresses.isEmpty) {
              return Text(
                'Você ainda não tem endereços cadastrados.',
                style: TextStyle(color: AppColors.textSecondary),
              );
            }
            return Column(
              children: [
                for (final address in addresses)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: NeonSurface(
                      child: InkWell(
                        onTap: () => onSelect(address),
                        borderRadius: BorderRadius.circular(20),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              const Icon(Icons.location_on,
                                  color: AppColors.primary),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Text(
                                  address.displayLine,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: onAddAddress,
          icon: const Icon(Icons.add),
          label: const Text('Adicionar endereço'),
        ),
      ],
    );
  }
}

class _ReviewStep extends StatelessWidget {
  const _ReviewStep({
    required this.service,
    required this.vehicle,
    required this.address,
    required this.submitting,
    required this.onConfirm,
  });

  final _WashService service;
  final VehicleModel vehicle;
  final AddressModel address;
  final bool submitting;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        NeonSurface(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ReviewLine(icon: service.icon, label: service.name),
              const SizedBox(height: 10),
              _ReviewLine(
                  icon: Icons.directions_car, label: vehicle.displayName),
              const SizedBox(height: 10),
              _ReviewLine(icon: Icons.location_on, label: address.displayLine),
              const Divider(height: 28, color: AppColors.border),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total',
                      style: TextStyle(color: AppColors.textSecondary)),
                  Text(
                    service.isAuction
                        ? 'A definir em leilão'
                        : 'R\$ ${service.price.toStringAsFixed(2)}',
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 18),
                  ),
                ],
              ),
              if (service.isAuction) ...[
                const SizedBox(height: 10),
                Text(
                  'Lojas de carwash cadastradas vão enviar ofertas de preço, '
                  'prazo e garantia no próximo passo.',
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        FilledButton(
          style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16)),
          onPressed: submitting ? null : onConfirm,
          child: submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppColors.primaryDark),
                )
              : Text(
                  service.isAuction ? 'Abrir para leilão' : 'Confirmar pedido'),
        ),
      ],
    );
  }
}

class _ReviewLine extends StatelessWidget {
  const _ReviewLine({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textMuted),
        const SizedBox(width: 10),
        Expanded(
          child:
              Text(label, style: const TextStyle(color: AppColors.textPrimary)),
        ),
      ],
    );
  }
}

class _PaymentStep extends StatelessWidget {
  const _PaymentStep({
    required this.totalAmount,
    required this.selectedMethod,
    required this.onSelect,
    required this.submitting,
    required this.onConfirm,
  });

  final double totalAmount;
  final int selectedMethod;
  final ValueChanged<int> onSelect;
  final bool submitting;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
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
                style: TextStyle(
                    color: AppColors.textPrimary, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                'Total R\$ ${totalAmount.toStringAsFixed(2)}',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Forma de pagamento',
          style: TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w800,
              fontSize: 16),
        ),
        const SizedBox(height: 4),
        Text(
          'Sem chaves de gateway real configuradas — pagamento confirmado em modo mock.',
          style: TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
        const SizedBox(height: 12),
        for (var i = 0; i < _methods.length; i++)
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
                    color: selectedMethod == i
                        ? AppColors.primary
                        : AppColors.border,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(_methods[i].icon, color: AppColors.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _methods[i].label,
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                    Icon(
                      selectedMethod == i
                          ? Icons.radio_button_checked
                          : Icons.radio_button_off,
                      color: selectedMethod == i
                          ? AppColors.primary
                          : AppColors.textMuted,
                    ),
                  ],
                ),
              ),
            ),
          ),
        const SizedBox(height: 8),
        FilledButton(
          style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16)),
          onPressed: submitting ? null : onConfirm,
          child: submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppColors.primaryDark),
                )
              : const Text('Confirmar Pagamento'),
        ),
      ],
    );
  }
}
