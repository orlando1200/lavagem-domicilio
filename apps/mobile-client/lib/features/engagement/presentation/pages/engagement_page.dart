import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/loyalty_balance_model.dart';
import '../../data/models/loyalty_history_model.dart';
import '../providers/engagement_provider.dart';

/// Tela "GIUCAR Points": saldo detalhado + historico de concessões e
/// resgates (GET /loyalty/balance + GET /loyalty/history). Antes desta
/// tela, os 3 pontos de entrada existentes na home (card de destaque,
/// ação rápida, menu do perfil) levavam pra um placeholder "Em breve"
/// mesmo já mostrando dados reais de fidelidade.
class EngagementPage extends ConsumerWidget {
  const EngagementPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balanceAsync = ref.watch(engagementProvider);
    final historyAsync = ref.watch(engagementHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('GIUCAR Points')),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(engagementProvider);
            ref.invalidate(engagementHistoryProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              balanceAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                ),
                error: (error, stackTrace) => Text(
                  'Não foi possível carregar seu saldo.',
                  style: TextStyle(color: AppColors.error),
                ),
                data: (balance) => _BalanceSummary(balance: balance),
              ),
              const SizedBox(height: 24),
              Text(
                'Histórico',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
              ),
              const SizedBox(height: 12),
              historyAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                ),
                error: (error, stackTrace) => Text(
                  'Não foi possível carregar o histórico.',
                  style: TextStyle(color: AppColors.error),
                ),
                data: (entries) {
                  if (entries.isEmpty) {
                    return Text(
                      'Nenhuma movimentação de pontos ainda.',
                      style: TextStyle(color: AppColors.textSecondary),
                    );
                  }
                  return Column(
                    children: [
                      for (final entry in entries) _HistoryTile(entry: entry),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BalanceSummary extends StatelessWidget {
  const _BalanceSummary({required this.balance});

  final LoyaltyBalanceModel balance;

  @override
  Widget build(BuildContext context) {
    final subtitle = balance.nextExpirationAmount != null &&
            balance.nextExpirationAt != null
        ? '${balance.nextExpirationAmount} pontos expiram em '
            '${balance.nextExpirationAt!.day}/${balance.nextExpirationAt!.month}'
        : 'Nenhum ponto expirando no momento';

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient:
                const LinearGradient(colors: AppColors.primaryAccentGradient),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                  color: AppColors.glow, blurRadius: 30, spreadRadius: -6),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Saldo disponível',
                style: TextStyle(
                  color: AppColors.textPrimary.withValues(alpha: 0.9),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${balance.balance} pontos',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w900,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'R\$ ${balance.balanceValue.toStringAsFixed(2)}',
                style: TextStyle(
                    color: AppColors.textPrimary.withValues(alpha: 0.85)),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: TextStyle(
                  color: AppColors.textPrimary.withValues(alpha: 0.85),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _MetricTile(
                label: 'Sequência',
                value: '${balance.streakDays} dias',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _MetricTile(
                label: 'Economia total',
                value: 'R\$ ${balance.totalSaved.toStringAsFixed(2)}',
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      radius: 16,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({required this.entry});

  final LoyaltyHistoryEntry entry;

  @override
  Widget build(BuildContext context) {
    final color = entry.isGrant ? AppColors.primary : AppColors.accentAlt;
    final sign = entry.isGrant ? '+' : '-';
    final title = entry.isGrant ? 'Pontos concedidos' : 'Pontos resgatados';
    final date = entry.createdAt;
    final dateLabel =
        '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                entry.isGrant
                    ? Icons.add_circle_outline
                    : Icons.remove_circle_outline,
                color: color,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    dateLabel,
                    style:
                        TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
            Text(
              '$sign${entry.amount} pts',
              style: TextStyle(color: color, fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
    );
  }
}
