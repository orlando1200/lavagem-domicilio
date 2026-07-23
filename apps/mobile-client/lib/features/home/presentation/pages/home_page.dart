import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_scaffold.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/providers/auth_state.dart';
import '../../../engagement/presentation/providers/engagement_provider.dart';
import '../../../../core/widgets/loading_skeleton.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _currentIndex = 0;

  final _pages = const [
    _HomeTab(),
    _HistoryTab(),
    _ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      body: _pages[_currentIndex],
      currentIndex: _currentIndex,
      onDestinationSelected: (i) => setState(() => _currentIndex = i),
    );
  }
}

// ── Home ────────────────────────────────────────────────────────────────────

class _HomeTab extends ConsumerWidget {
  const _HomeTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final engagement = ref.watch(engagementProvider);

    final userName = authState.maybeWhen(
      authenticated: (user) => user.name.split(' ').first,
      orElse: () => '',
    );

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: _HomeHeader(userName: userName),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              const _QuickActionsCard(),
              const SizedBox(height: 16),
              _EngagementHighlightCard(engagement: engagement),
              const SizedBox(height: 16),
              const _ServicesSection(),
              const SizedBox(height: 16),
              const _MarketplaceBanner(),
              const SizedBox(height: 16),
              const _PromoSection(),
            ]),
          ),
        ),
      ],
    );
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.userName});

  final String userName;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primaryContainer, AppColors.accentContainer, AppColors.background],
        ),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
        boxShadow: const [
          BoxShadow(color: AppColors.glow, blurRadius: 30, spreadRadius: -6),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.accent],
              ),
              boxShadow: const [
                BoxShadow(color: AppColors.glow, blurRadius: 18, spreadRadius: 1),
              ],
            ),
            child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userName.isEmpty ? 'Olá!' : 'Olá, $userName!',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Pronto para deixar seu veículo brilhando?',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.78),
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EngagementHighlightCard extends StatelessWidget {
  const _EngagementHighlightCard({required this.engagement});

  final EngagementState engagement;

  @override
  Widget build(BuildContext context) {
    final remaining = engagement.nextRewardAt - engagement.loyaltyPoints;
    return NeonSurface(
      child: InkWell(
        onTap: () => context.push('/engagement'),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.workspace_premium_rounded, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Seu progresso de fidelidade',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${engagement.loyaltyPoints} pontos · faltam $remaining para o próximo cupom',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded),
                ],
              ),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: (engagement.loyaltyPoints / engagement.nextRewardAt).clamp(0, 1),
                  minHeight: 10,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _EngagementMiniMetric(
                      label: 'Sequência',
                      value: '${engagement.streakDays} dias',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _EngagementMiniMetric(
                      label: 'Economia',
                      value: 'R\$ ${engagement.savedAmount.toStringAsFixed(2)}',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EngagementMiniMetric extends StatelessWidget {
  const _EngagementMiniMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionsCard extends StatelessWidget {
  const _QuickActionsCard();

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Ações rápidas',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  )),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _QuickAction(
                icon: Icons.shopping_bag_outlined,
                label: 'Loja\nProdutos',
                onTap: () => context.push('/marketplace'),
              ),
              _QuickAction(
                icon: Icons.two_wheeler,
                label: 'Aluguel\nMoto',
                onTap: () => context.push('/moto-rental'),
              ),
              _QuickAction(
                icon: Icons.car_repair,
                label: 'Solicitar\nLavagem',
                onTap: () => context.push('/catalog'),
              ),
              _QuickAction(
                icon: Icons.directions_car,
                label: 'Meus\nVeículos',
                onTap: () => context.push('/vehicles'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Icon(icon, color: colorScheme.primary),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _ServicesSection extends StatelessWidget {
  const _ServicesSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Serviços populares',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    )),
            TextButton(
                onPressed: () => context.push('/catalog'),
                child: const Text('Ver todos')),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 124,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: const [
              _ServiceChip(title: 'Lavagem Simples', price: 'R\$ 29,90', icon: Icons.water_drop),
              _ServiceChip(title: 'Lavagem Completa', price: 'R\$ 59,90', icon: Icons.local_car_wash),
              _ServiceChip(title: 'Polimento', price: 'R\$ 89,90', icon: Icons.auto_fix_high),
              _ServiceChip(title: 'Higienização', price: 'R\$ 149,90', icon: Icons.cleaning_services),
            ],
          ),
        ),
      ],
    );
  }
}

class _ServiceChip extends StatelessWidget {
  const _ServiceChip({
    required this.title,
    required this.price,
    required this.icon,
  });

  final String title;
  final String price;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      width: 132,
      margin: const EdgeInsets.only(right: 12),
      child: NeonSurface(
        radius: 16,
        child: InkWell(
          onTap: () => context.push('/catalog'),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: colorScheme.primary, size: 26),
                const Spacer(),
                Text(title,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        )),
                const SizedBox(height: 2),
                Text(price,
                    style: Theme.of(context)
                        .textTheme
                        .labelSmall
                        ?.copyWith(color: colorScheme.primary)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MarketplaceBanner extends StatelessWidget {
  const _MarketplaceBanner();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: NeonSurface(
            radius: 14,
            backgroundColor: AppColors.surfaceAlt,
            child: InkWell(
              onTap: () => context.push('/marketplace'),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                height: 88,
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Text('🛒', style: TextStyle(fontSize: 28)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('Loja',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(fontWeight: FontWeight.bold)),
                          Text('Produtos de limpeza',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                      color: Theme.of(context).colorScheme.onSurfaceVariant)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: NeonSurface(
            radius: 14,
            backgroundColor: AppColors.accentContainer,
            borderColor: AppColors.accent.withValues(alpha: 0.4),
            child: InkWell(
              onTap: () => context.push('/moto-rental'),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                height: 88,
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Text('🏍️', style: TextStyle(fontSize: 28)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('Motos',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(fontWeight: FontWeight.bold)),
                          Text('Aluguel parceiros',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                      color: Theme.of(context).colorScheme.onSurfaceVariant)),
                        ],
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
  }
}

class _PromoSection extends StatelessWidget {
  const _PromoSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.accent],
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(color: AppColors.glow, blurRadius: 24, spreadRadius: -4),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Primeira lavagem',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        )),
                Text('20% de desconto!',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white70,
                        )),
              ],
            ),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.white),
            onPressed: () => context.push('/quote'),
            child: const Text('Ver oferta', style: TextStyle(color: AppColors.primaryDark)),
          ),
        ],
      ),
    );
  }
}

// ── Histórico ────────────────────────────────────────────────────────────────

class _HistoryTab extends StatelessWidget {
  const _HistoryTab();

  @override
  Widget build(BuildContext context) {
    // Delegate to dedicated orders page (Fase 2)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.push('/orders');
    });
    return const Center(
      child: CircularProgressIndicator(color: AppColors.primary),
    );
  }
}

// ── Perfil ───────────────────────────────────────────────────────────────────

class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      initial: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      loading: () => const _ProfileLoading(),
      authenticated: (user) => _ProfileView(user: user, ref: ref),
      unauthenticated: () => const Center(child: Text('Não autenticado')),
      error: (msg) => Center(child: Text(msg)),
    );
  }
}

class _ProfileLoading extends StatelessWidget {
  const _ProfileLoading();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: const Text('Perfil')),
      body: const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            LoadingSkeleton(height: 80, radius: 40),
            SizedBox(height: 16),
            LoadingSkeleton(height: 24),
            SizedBox(height: 8),
            LoadingSkeleton(height: 16),
          ],
        ),
      ),
    );
  }
}

class _ProfileView extends StatelessWidget {
  const _ProfileView({required this.user, required this.ref});

  final dynamic user;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.accent],
                ),
                boxShadow: const [
                  BoxShadow(color: AppColors.glow, blurRadius: 24, spreadRadius: 1),
                ],
              ),
              child: Center(
                child: Text(
                  user.name.substring(0, 1).toUpperCase(),
                  style: const TextStyle(
                    fontSize: 36,
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            user.name,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          Text(
            user.email,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 24),
          _ProfileMenuItem(
            icon: Icons.directions_car,
            title: 'Meus Veículos',
            onTap: () => context.push('/vehicles'),
          ),
          _ProfileMenuItem(
            icon: Icons.location_on,
            title: 'Meus Endereços',
            onTap: () => context.push('/addresses'),
          ),
          _ProfileMenuItem(
            icon: Icons.receipt_long,
            title: 'Histórico de Pagamentos',
            onTap: () => context.push('/payment-history'),
          ),
          _ProfileMenuItem(
            icon: Icons.workspace_premium_outlined,
            title: 'Engajamento e recompensas',
            onTap: () => context.push('/engagement'),
          ),
          _ProfileMenuItem(
            icon: Icons.edit,
            title: 'Editar Perfil',
            onTap: () {},
          ),
          _ProfileMenuItem(
            icon: Icons.security,
            title: 'Alterar Senha',
            onTap: () {},
          ),
          const SizedBox(height: 8),
          NeonSurface(
            child: ListTile(
              leading: const Icon(Icons.exit_to_app, color: AppColors.error),
              title: const Text('Sair', style: TextStyle(color: AppColors.error)),
              onTap: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileMenuItem extends StatelessWidget {
  const _ProfileMenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: onTap,
      ),
    );
  }
}

