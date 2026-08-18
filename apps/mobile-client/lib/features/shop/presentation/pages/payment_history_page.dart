import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/payment_model.dart';
import '../../data/payments_repository.dart';

const Map<String, String> _statusLabels = {
  'pending': 'Pendente',
  'paid': 'Pago',
  'failed': 'Falhou',
  'refunded': 'Reembolsado',
};

const Map<String, String> _methodLabels = {
  'pix': 'Pix',
  'credit_card': 'Cartão de crédito',
  'debit_card': 'Cartão de débito',
  'cash': 'Dinheiro',
  'wallet': 'Carteira',
};

Color _statusColor(String status) {
  switch (status) {
    case 'paid':
      return AppColors.primary;
    case 'failed':
      return AppColors.error;
    default:
      return AppColors.textMuted;
  }
}

/// Historico de pagamentos do cliente (GET /payments/mine).
class PaymentHistoryPage extends ConsumerStatefulWidget {
  const PaymentHistoryPage({super.key});

  @override
  ConsumerState<PaymentHistoryPage> createState() => _PaymentHistoryPageState();
}

class _PaymentHistoryPageState extends ConsumerState<PaymentHistoryPage> {
  List<PaymentModel>? _payments;
  bool _loading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final payments = await ref.read(paymentsRepositoryProvider).fetchHistory();
      if (!mounted) return;
      setState(() => _payments = payments);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatDate(DateTime date) {
    final local = date.toLocal();
    return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Histórico de Pagamentos')),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    final payments = _payments;

    if (_loading && payments == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_errorMessage != null && payments == null) {
      return ListView(
        children: [
          const SizedBox(height: 80),
          Text(_errorMessage!, style: const TextStyle(color: AppColors.error), textAlign: TextAlign.center),
        ],
      );
    }
    if (payments == null || payments.isEmpty) {
      return ListView(
        children: [
          const SizedBox(height: 100),
          Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Text(
            'Nenhum pagamento por aqui ainda.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: payments.length,
      itemBuilder: (context, index) {
        final payment = payments[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: NeonSurface(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'R\$ ${payment.amount.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_methodLabels[payment.method] ?? payment.method} · ${_formatDate(payment.createdAt)}',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor(payment.status).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _statusLabels[payment.status] ?? payment.status,
                    style: TextStyle(color: _statusColor(payment.status), fontWeight: FontWeight.w700, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
