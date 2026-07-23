import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/providers/auth_state.dart';

/// Tela "Plano da loja": comparativo entre Logística Integrada e Própria
/// para o [StoreType] atual do lojista logado.
///
/// Todos os valores de mensalidade/comissão vem de [StorePlanRules].
class PlanPage extends ConsumerWidget {
  const PlanPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.maybeWhen(
      authenticated: (u) => u,
      orElse: () => null,
    );

    if (user == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Text('Não autenticado', style: TextStyle(color: AppColors.textPrimary)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Plano da loja')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            Text(
              'Escolha como quer vender · ${user.storeType.label}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 16),
            ...LogisticsMode.values.map(
              (mode) => _PlanCard(
                mode: mode,
                storeType: user.storeType,
                isCurrent: user.logisticsMode == mode,
                onSelect: () => ref.read(authProvider.notifier).updatePlan(
                      storeType: user.storeType,
                      logisticsMode: mode,
                    ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Comparativo completo das tarifas',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Veja como cada combinação de tipo de loja e logística é cobrada.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 12),
            NeonSurface(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final combo in StorePlanRules.allCombinations)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          Icon(
                            combo.type == user.storeType && combo.mode == user.logisticsMode
                                ? Icons.check_circle_rounded
                                : Icons.circle_outlined,
                            size: 16,
                            color: combo.type == user.storeType && combo.mode == user.logisticsMode
                                ? AppColors.primary
                                : AppColors.textMuted,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '${combo.type.label} · ${combo.mode.label}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ),
                          Text(
                            StorePlanRules.summaryFor(combo.mode, combo.type),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Regras de cobrança',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 12),
            NeonSurface(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'A mensalidade e a comissão exibidas correspondem ao tipo de loja '
                    '(${user.storeType.label}) e à modalidade de logística escolhida.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textPrimary,
                        ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Plano atual: ${user.logisticsMode.label}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  Text(
                    StorePlanRules.summaryFor(user.logisticsMode, user.storeType),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.mode,
    required this.storeType,
    required this.isCurrent,
    required this.onSelect,
  });

  final LogisticsMode mode;
  final StoreType storeType;
  final bool isCurrent;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    final fee = StorePlanRules.monthlyFeeFor(mode, storeType);
    final commission = StorePlanRules.commissionPercentFor(mode, storeType);

    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 12),
      borderColor: isCurrent ? AppColors.primary : AppColors.border,
      glowColor: isCurrent ? AppColors.glow : AppColors.glow.withValues(alpha: 0.08),
      child: InkWell(
        onTap: onSelect,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      mode.label,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                    ),
                  ),
                  if (isCurrent)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'ATUAL',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                mode.description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 14),
              Text(
                'R\$ ${fee.toStringAsFixed(0)}/mês',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                'Comissão: ${commission.toStringAsFixed(0)}% por venda',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
