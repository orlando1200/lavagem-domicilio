import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../orders/orders_provider.dart';
import '../../../orders/data/models/order_model.dart';
import '../../auctions_provider.dart';
import '../../data/auctions_repository.dart';
import '../../data/heavy_services.dart';

/// Formulario de solicitacao de leilao: cliente escolhe um pedido
/// pendente proprio, os servicos pesados desejados e, opcionalmente,
/// orcamento maximo e prazo para receber ofertas (POST /auctions).
class CreateAuctionPage extends ConsumerStatefulWidget {
  const CreateAuctionPage({super.key});

  @override
  ConsumerState<CreateAuctionPage> createState() => _CreateAuctionPageState();
}

class _CreateAuctionPageState extends ConsumerState<CreateAuctionPage> {
  String? _selectedOrderId;
  final Set<String> _selectedServiceIds = {};
  final _maxBudgetController = TextEditingController();
  final _deadlineHoursController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _photoUrlController = TextEditingController();
  final List<String> _photos = [];
  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _maxBudgetController.dispose();
    _deadlineHoursController.dispose();
    _descriptionController.dispose();
    _photoUrlController.dispose();
    super.dispose();
  }

  void _addPhotoUrl() {
    final url = _photoUrlController.text.trim();
    if (url.isEmpty) return;
    setState(() {
      _photos.add(url);
      _photoUrlController.clear();
    });
  }

  Future<void> _submit() async {
    if (_selectedOrderId == null || _selectedServiceIds.isEmpty) {
      setState(() {
        _errorMessage = 'Escolha um pedido e ao menos um serviço.';
      });
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final maxBudget = double.tryParse(_maxBudgetController.text.replaceAll(',', '.'));
      final deadlineHours = int.tryParse(_deadlineHoursController.text);

      final auction = await ref.read(auctionsRepositoryProvider).createAuction(
            orderId: _selectedOrderId!,
            serviceIds: _selectedServiceIds.toList(),
            maxBudget: maxBudget,
            deadlineHours: deadlineHours,
            photos: _photos.isEmpty ? null : _photos,
            description:
                _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
          );

      ref.invalidate(myAuctionsProvider);

      if (mounted) {
        context.pushReplacement('/auctions/${auction.id}');
      }
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(myOrdersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Solicitar Leilão')),
      body: ordersAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (error, stackTrace) => Center(
          child: Text(error.toString(), style: const TextStyle(color: AppColors.error)),
        ),
        data: (orders) {
          final pendingOrders = orders.where((order) => order.status == 'pending').toList();

          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                NeonSurface(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Formato InDrive: lojas de carwash cadastradas enviam preço, prazo e '
                    'garantia. Você compara e escolhe a melhor oferta.',
                    style: TextStyle(color: AppColors.accentAlt, fontSize: 13, height: 1.5),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Pedido',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                if (pendingOrders.isEmpty)
                  Text(
                    'Você não tem nenhum pedido pendente no momento. Crie um pedido antes '
                    'de abrir um leilão.',
                    style: TextStyle(color: AppColors.textSecondary),
                  )
                else
                  ...pendingOrders.map(
                    (order) => _OrderOption(
                      order: order,
                      selected: _selectedOrderId == order.id,
                      onTap: () => setState(() => _selectedOrderId = order.id),
                    ),
                  ),
                const SizedBox(height: 20),
                const Text(
                  'Serviços desejados',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                ...heavyServices.map(
                  (service) => _ServiceOption(
                    service: service,
                    selected: _selectedServiceIds.contains(service.id),
                    onChanged: (checked) => setState(() {
                      if (checked) {
                        _selectedServiceIds.add(service.id);
                      } else {
                        _selectedServiceIds.remove(service.id);
                      }
                    }),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Descrição adicional (opcional)',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'Descreva o estado do veículo, danos, o que precisa ser feito etc.',
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Fotos (opcional, link)',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _photoUrlController,
                        decoration: const InputDecoration(hintText: 'https://...'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: _addPhotoUrl,
                      icon: const Icon(Icons.add_circle, color: AppColors.primary),
                    ),
                  ],
                ),
                if (_photos.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _photos
                        .map(
                          (url) => Chip(
                            label: Text(url, overflow: TextOverflow.ellipsis),
                            onDeleted: () => setState(() => _photos.remove(url)),
                          ),
                        )
                        .toList(),
                  ),
                const SizedBox(height: 20),
                const Text(
                  'Orçamento máximo (opcional)',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _maxBudgetController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(hintText: 'R\$', prefixText: 'R\$ '),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Prazo para receber ofertas, em horas (opcional)',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: _deadlineHoursController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(hintText: 'Ex.: 48'),
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(_errorMessage!, style: const TextStyle(color: AppColors.error)),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                    onPressed: _submitting || pendingOrders.isEmpty ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryDark),
                          )
                        : const Text('Abrir leilão'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _OrderOption extends StatelessWidget {
  const _OrderOption({required this.order, required this.selected, required this.onTap});

  final OrderModel order;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: NeonSurface(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        borderColor: selected ? AppColors.primary : AppColors.border,
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: selected ? AppColors.primary : AppColors.textMuted,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Pedido #${order.id.substring(0, order.id.length.clamp(0, 8))} · '
                'R\$ ${order.totalAmount.toStringAsFixed(2)}',
                style: const TextStyle(color: AppColors.textPrimary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ServiceOption extends StatelessWidget {
  const _ServiceOption({required this.service, required this.selected, required this.onChanged});

  final HeavyService service;
  final bool selected;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!selected),
      borderRadius: BorderRadius.circular(16),
      child: NeonSurface(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        borderColor: selected ? AppColors.primary : AppColors.border,
        child: Row(
          children: [
            Text(service.emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.title,
                    style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    service.description,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
            Checkbox(
              value: selected,
              activeColor: AppColors.primary,
              onChanged: (checked) => onChanged(checked ?? false),
            ),
          ],
        ),
      ),
    );
  }
}
