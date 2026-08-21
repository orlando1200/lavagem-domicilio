import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/fiscal_debt_model.dart';
import '../../data/models/vehicle_model.dart';
import '../providers/vehicles_provider.dart';

String _formatDate(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  return '$day/$month/${date.year}';
}

/// Consulta de IPVA/multas/licenciamento (modo simulado — GET
/// /vehicles/:id/fiscal-debts). So consulta: o botão de pagamento fica
/// desabilitado ("Em breve"), o backend já persiste cada débito com um
/// id estável pra quando o pagamento de verdade existir (Fase 2), sem
/// precisar de migração nova nesse momento.
class FiscalDebtsPage extends ConsumerStatefulWidget {
  const FiscalDebtsPage({super.key});

  @override
  ConsumerState<FiscalDebtsPage> createState() => _FiscalDebtsPageState();
}

class _FiscalDebtsPageState extends ConsumerState<FiscalDebtsPage> {
  String? _selectedVehicleId;

  @override
  Widget build(BuildContext context) {
    final vehiclesAsync = ref.watch(vehiclesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('IPVA e Multas')),
      body: SafeArea(
        child: vehiclesAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          error: (error, stackTrace) => _FiscalDebtsError(
            message: error.toString(),
            onRetry: () => ref.invalidate(vehiclesProvider),
          ),
          data: (vehicles) {
            if (vehicles.isEmpty) return const _NoVehicles();

            String? selectedId = _selectedVehicleId;
            VehicleModel? selected;
            for (final v in vehicles) {
              if (v.id == selectedId) selected = v;
            }
            selected ??= vehicles.first;
            selectedId = selected.id;

            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                if (vehicles.length > 1) ...[
                  _VehicleSelector(
                    vehicles: vehicles,
                    selectedId: selectedId,
                    onSelected: (id) => setState(() => _selectedVehicleId = id),
                  ),
                  const SizedBox(height: 16),
                ],
                _FiscalDebtsList(vehicleId: selectedId),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _VehicleSelector extends StatelessWidget {
  const _VehicleSelector({
    required this.vehicles,
    required this.selectedId,
    required this.onSelected,
  });

  final List<VehicleModel> vehicles;
  final String selectedId;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final v in vehicles)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(v.displayName),
                selected: v.id == selectedId,
                onSelected: (_) => onSelected(v.id),
                selectedColor: AppColors.primaryContainer,
                backgroundColor: AppColors.surfaceAlt,
                labelStyle: TextStyle(
                  color: v.id == selectedId ? AppColors.primary : AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
                side: BorderSide(color: v.id == selectedId ? AppColors.primary : AppColors.border),
              ),
            ),
        ],
      ),
    );
  }
}

class _FiscalDebtsList extends ConsumerWidget {
  const _FiscalDebtsList({required this.vehicleId});

  final String vehicleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final debtsAsync = ref.watch(fiscalDebtsProvider(vehicleId));

    return debtsAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.only(top: 40),
        child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (error, stackTrace) => _FiscalDebtsError(
        message: error.toString(),
        onRetry: () => ref.invalidate(fiscalDebtsProvider(vehicleId)),
      ),
      data: (debts) {
        if (debts.isEmpty) return const _NoDebts();
        return Column(
          children: [for (final debt in debts) _DebtCard(debt: debt)],
        );
      },
    );
  }
}

class _DebtCard extends StatelessWidget {
  const _DebtCard({required this.debt});

  final FiscalDebtEntry debt;

  Color get _typeColor {
    switch (debt.type) {
      case FiscalDebtType.IPVA:
        return AppColors.primary;
      case FiscalDebtType.MULTA:
        return AppColors.error;
      case FiscalDebtType.LICENCIAMENTO:
        return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _typeColor;
    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    debt.type.label,
                    style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800),
                  ),
                ),
                if (debt.isOverdue) ...[
                  const SizedBox(width: 8),
                  Text(
                    'Vencida',
                    style: TextStyle(color: AppColors.error, fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(
              debt.description,
              style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            if (debt.dueDate != null) ...[
              const SizedBox(height: 4),
              Text(
                'Vencimento: ${_formatDate(debt.dueDate!)}',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  'R\$ ${debt.amount.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const Spacer(),
                Tooltip(
                  message: 'Pagamento por aqui ainda não está disponível',
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceAlt,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      'Pagamento em breve',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700),
                    ),
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

class _NoDebts extends StatelessWidget {
  const _NoDebts();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check_circle_outline_rounded, color: AppColors.primary, size: 48),
          const SizedBox(height: 12),
          Text(
            'Nenhum débito encontrado pra esse veículo.',
            style: TextStyle(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _NoVehicles extends StatelessWidget {
  const _NoVehicles();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.directions_car_outlined, color: AppColors.textMuted, size: 48),
            const SizedBox(height: 12),
            Text(
              'Cadastre um veículo pra consultar IPVA e multas.',
              style: TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.push('/vehicles/new'),
              child: const Text('Cadastrar veículo'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FiscalDebtsError extends StatelessWidget {
  const _FiscalDebtsError({required this.message, required this.onRetry});

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
