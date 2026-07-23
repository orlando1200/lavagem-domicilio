import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_scaffold.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../../core/widgets/loading_skeleton.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/providers/auth_state.dart';
import '../../../engagement/presentation/providers/engagement_provider.dart';
import '../../../shop/presentation/pages/shop_page.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _currentIndex = 0;

  final _pages = const [
    _HomeTab(),
    ShopPage(),
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

/// Cabecalho da home com fusao organica entre o "background" visual
/// (composicao de spots neon, ja que o repo nao possui uma imagem de
/// fundo dedicada) e a cor base #050811, usando ShaderMask com
/// RadialGradient + BlendMode.dstOut. Inclui o espaco reservado para o
/// logo transparente `logo_giucar.png`.
class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.userName});

  final String userName;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Composicao visual equivalente a uma imagem de fundo: spots de
          // luz ciano/roxo fundidos organicamente com #050811 via
          // ShaderMask + RadialGradient + BlendMode.dstOut.
          Positioned.fill(
            child: _HeaderNeonFusion(),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Espaco reservado para o logo transparente no topo.
              Center(
                child: Image.asset(
                  'assets/images/logo_giucar.png',
                  height: 44,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(
                    height: 44,
                    child: Icon(Icons.bolt_rounded, color: AppColors.primary, size: 32),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: AppColors.primaryAccentGradient,
                      ),
                      boxShadow: [
                        BoxShadow(color: AppColors.glow, blurRadius: 18, spreadRadius: 1),
                      ],
                    ),
                    child: const Icon(Icons.bolt_rounded, color: AppColors.textPrimary, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          userName.isEmpty ? 'Olá!' : 'Olá, $userName!',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w900,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Pronto para deixar seu veículo brilhando?',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Fusao organica de spots neon (ciano + roxo) sobre o fundo #050811,
/// usando ShaderMask/RadialGradient/BlendMode.dstOut por spot, o que evita
/// bordas duras entre a "imagem" e a cor base e funciona bem sob
/// CanvasKit/WebGL (sem depender de BackdropFilter/blur pesado).
class _HeaderNeonFusion extends StatelessWidget {
  const _HeaderNeonFusion();

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        _NeonFusionSpot(
          alignment: const Alignment(-1.1, -1.2),
          color: AppColors.primary,
          size: 260,
        ),
        _NeonFusionSpot(
          alignment: const Alignment(1.2, -0.8),
          color: AppColors.accent,
          size: 240,
        ),
        _NeonFusionSpot(
          alignment: const Alignment(0.3, 1.4),
          color: AppColors.primaryAlt,
          size: 220,
        ),
      ],
    );
  }
}

class _NeonFusionSpot extends StatelessWidget {
  const _NeonFusionSpot({
    required this.alignment,
    required this.color,
    required this.size,
  });

  final Alignment alignment;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignment,
      child: ShaderMask(
        blendMode: BlendMode.dstOut,
        shaderCallback: (rect) {
          return RadialGradient(
            center: Alignment.center,
            radius: 0.5,
            colors: [
              AppColors.background.withValues(alpha: 0.0),
              AppColors.background.withValues(alpha: 1.0),
            ],
            stops: const [0.0, 1.0],
          ).createShader(rect);
        },
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                color.withValues(alpha: 0.5),
                color.withValues(alpha: 0.0),
              ],
              stops: const [0.0, 1.0],
            ),
          ),
        ),
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
                      color: AppColors.primaryContainer,
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
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${engagement.loyaltyPoints} pontos · faltam $remaining para o próximo cupom',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                ],
              ),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: (engagement.loyaltyPoints / engagement.nextRewardAt).clamp(0, 1),
                  minHeight: 10,
                  backgroundColor: AppColors.border,
                  valueColor: const AlwaysStoppedAnimation(AppColors.primary),
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
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
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
          Text(
            'Ações rápidas',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _QuickAction(
                icon: Icons.shopping_bag_outlined,
                label: 'Loja\nAcessórios',
                onTap: () => context.push('/shop'),
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
                color: AppColors.primaryContainer,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Icon(icon, color: AppColors.primary),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
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
            Text(
              'Serviços populares',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
            ),
            TextButton(
              onPressed: () => context.push('/catalog'),
              child: const Text('Ver todos'),
            ),
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
                Icon(icon, color: AppColors.primary, size: 26),
                const Spacer(),
                Text(
                  title,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  price,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.primary,
                      ),
                ),
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
              onTap: () => context.push('/shop'),
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
                          Text(
                            'Loja de Acessórios',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                          ),
                          Text(
                            'Acessórios e souvenirs pro seu carro',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
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
            borderColor: AppColors.accent,
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
                          Text(
                            'Motos',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                          ),
                          Text(
                            'Aluguel parceiros',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
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
          colors: AppColors.primaryAccentGradient,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
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
                Text(
                  'Primeira lavagem',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  '20% de desconto!',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.textPrimary,
              foregroundColor: AppColors.primaryDark,
            ),
            onPressed: () => context.push('/quote'),
            child: const Text('Ver oferta'),
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
      unauthenticated: () => const Center(
        child: Text('Não autenticado', style: TextStyle(color: AppColors.textPrimary)),
      ),
      error: (msg) => Center(
        child: Text(msg, style: const TextStyle(color: AppColors.error)),
      ),
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

  final AppUser user;
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
                  colors: AppColors.primaryAccentGradient,
                ),
                boxShadow: [
                  BoxShadow(color: AppColors.glow, blurRadius: 24, spreadRadius: 1),
                ],
              ),
              child: Center(
                child: Text(
                  user.name.substring(0, 1).toUpperCase(),
                  style: const TextStyle(
                    fontSize: 36,
                    color: AppColors.textPrimary,
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
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
          ),
          Text(
            user.email,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
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
            color: AppColors.primaryContainer,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        ),
        trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
        onTap: onTap,
      ),
    );
  }
}
