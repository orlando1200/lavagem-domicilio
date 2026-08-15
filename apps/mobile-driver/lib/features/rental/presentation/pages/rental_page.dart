import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_exception.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/rental_model.dart';
import '../../data/rental_repository.dart';
import '../providers/rental_provider.dart';

/// Tela de "Aluguel de moto" (autoservico): o lavador ve o status do
/// seu aluguel atual ou solicita um novo. Sem tabela de planos/precos
/// no backend — a solicitacao nasce sem valor definido, o admin
/// confirma o valor semanal real ao aprovar (`assign-driver` no painel).
class RentalPage extends ConsumerStatefulWidget {
  const RentalPage({super.key});

  @override
  ConsumerState<RentalPage> createState() => _RentalPageState();
}

class _RentalPageState extends ConsumerState<RentalPage> {
  bool _submitting = false;
  String? _errorMessage;

  Future<void> _requestRental() async {
    setState(() {
      _submitting = true;
      _errorMessage = null;
    });
    try {
      await ref.read(rentalRepositoryProvider).requestRental();
      ref.invalidate(myRentalProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Solicitação enviada! Aguarde a aprovação da equipe GIUCAR.')),
      );
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rentalAsync = ref.watch(myRentalProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Aluguel de moto')),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(myRentalProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              rentalAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                ),
                error: (error, stackTrace) => _ErrorState(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(myRentalProvider),
                ),
                data: (rental) => rental == null ||
                        rental.status == RentalStatus.completed ||
                        rental.status == RentalStatus.cancelled
                    ? _RequestCard(
                        previous: rental,
                        submitting: _submitting,
                        onRequest: _requestRental,
                      )
                    : _RentalStatusCard(rental: rental),
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 12),
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

class _RequestCard extends StatelessWidget {
  const _RequestCard({
    required this.previous,
    required this.submitting,
    required this.onRequest,
  });

  final RentalModel? previous;
  final bool submitting;
  final VoidCallback onRequest;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(Icons.two_wheeler_rounded, color: AppColors.primary, size: 40),
          const SizedBox(height: 12),
          Text(
            'Alugue uma moto GIUCAR',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Solicite o aluguel de uma moto para trabalhar. A equipe GIUCAR '
            'analisa sua solicitação e confirma o valor semanal na aprovação.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, height: 1.4),
          ),
          if (previous != null) ...[
            const SizedBox(height: 12),
            Text(
              'Seu último aluguel: ${previous!.status.label}',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
          ],
          const SizedBox(height: 20),
          FilledButton(
            style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16)),
            onPressed: submitting ? null : onRequest,
            child: submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.primaryDark),
                  )
                : const Text('Solicitar aluguel'),
          ),
        ],
      ),
    );
  }
}

class _RentalStatusCard extends StatelessWidget {
  const _RentalStatusCard({required this.rental});

  final RentalModel rental;

  Color _statusColor() {
    switch (rental.status) {
      case RentalStatus.active:
        return AppColors.primary;
      case RentalStatus.overdue:
        return AppColors.error;
      case RentalStatus.requested:
        return AppColors.accent;
      case RentalStatus.completed:
      case RentalStatus.cancelled:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _statusColor();

    return NeonSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.two_wheeler_rounded, color: color, size: 32),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Seu aluguel de moto',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: color),
                ),
                child: Text(
                  rental.status.label,
                  style: TextStyle(
                      color: color, fontWeight: FontWeight.w700, fontSize: 12),
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(),
          ),
          _InfoRow(
            label: 'Valor semanal',
            value: rental.hasDefinedRate
                ? 'R\$ ${rental.weeklyRate.toStringAsFixed(2)}'
                : 'A definir na aprovação',
          ),
          if (rental.startedAt != null) ...[
            const SizedBox(height: 8),
            _InfoRow(label: 'Início', value: _formatDate(rental.startedAt!)),
          ],
          if (rental.isPending) ...[
            const SizedBox(height: 16),
            Text(
              'Sua solicitação está com a equipe GIUCAR. Você será avisado assim que for aprovada.',
              style: TextStyle(
                  color: AppColors.textSecondary, fontSize: 13, height: 1.4),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        Text(
          value,
          style: const TextStyle(
              color: AppColors.textPrimary, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Text(message,
              style: const TextStyle(color: AppColors.error),
              textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton(
              onPressed: onRetry, child: const Text('Tentar novamente')),
        ],
      ),
    );
  }
}
