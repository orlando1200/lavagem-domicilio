import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_scaffold.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

/// Home do Portal do Lojista: saldo a receber, metricas da loja e
/// pedidos recentes.
class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _currentIndex = 0;

  void _onDestinationSelected(int index) {
    switch (index) {
      case 0:
        setState(() => _currentIndex = 0);
        break;
      case 1:
        context.push('/products');
        break;
      case 2:
        // Pedidos: sem tela dedicada no escopo atual; mantem na home.
        setState(() => _currentIndex = 0);
        break;
      case 3:
        setState(() => _currentIndex = 3);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      body: _currentIndex == 3 ? const _ProfileTab() : const _HomeTab(),
      currentIndex: _currentIndex,
      onDestinationSelected: _onDestinationSelected,
    );
  }
}

// ── Home ────────────────────────────────────────────────────────────────────

class _HomeTab extends ConsumerWidget {
  const _HomeTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final storeName = authState.maybeWhen(
      authenticated: (user) => user.storeName,
      orElse: () => 'Loja',
    );

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: _HomeHeader(storeName: storeName),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              const _BalanceCard(),
              const SizedBox(height: 20),
              const _MetricsSection(),
              const SizedBox(height: 20),
              const _RecentOrdersSection(),
              const SizedBox(height: 16),
              const _AuctionEntryCard(),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => context.push('/products/new'),
                icon: const Icon(Icons.add_rounded),
                label: const Text('Cadastrar novo produto'),
              ),
            ]),
          ),
        ),
      ],
    );
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.storeName});

  final String storeName;

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
          Positioned.fill(
            child: _HeaderNeonFusion(),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Image.asset(
                  'assets/images/logo_giucar.png',
                  height: 40,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(
                    height: 40,
                    child: Icon(Icons.bolt_rounded, color: AppColors.primary, size: 30),
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
                    child: const Icon(Icons.storefront_rounded, color: AppColors.textPrimary, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Olá, $storeName!',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w900,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Resumo da sua loja',
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

class _BalanceCard extends StatelessWidget {
  const _BalanceCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: AppColors.primaryAccentGradient,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: AppColors.glow, blurRadius: 30, spreadRadius: -6),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Saldo a receber',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textPrimary.withValues(alpha: 0.9),
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'R\$ 2.450,80',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w900,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Próximo repasse: 25/07',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textPrimary.withValues(alpha: 0.85),
                ),
          ),
        ],
      ),
    );
  }
}

class _MetricsSection extends StatelessWidget {
  const _MetricsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Métricas',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: const [
            _MetricTile(value: '28', label: 'Vendas'),
            _MetricTile(value: '12', label: 'Produtos ativos'),
            _MetricTile(value: '4.8', label: 'Avaliação'),
            _MetricTile(value: '23%', label: 'Comissão'),
          ],
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      radius: 16,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
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
      ),
    );
  }
}

class _RecentOrdersSection extends StatelessWidget {
  const _RecentOrdersSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Pedidos recentes',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
        ),
        const SizedBox(height: 12),
        const _OrderCard(
          title: 'Shampoo Automotivo 5L',
          price: 'R\$ 89,90',
          subtitle: 'Carlos Silva · Lavador',
          status: 'Aguardando envio',
          showActions: true,
        ),
        const _OrderCard(
          title: 'Cera Líquida Premium 1L',
          price: 'R\$ 129,90',
          subtitle: 'João Souza · Lavador',
          status: 'Entregue',
          showActions: false,
        ),
      ],
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({
    required this.title,
    required this.price,
    required this.subtitle,
    required this.status,
    required this.showActions,
  });

  final String title;
  final String price;
  final String subtitle;
  final String status;
  final bool showActions;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                  ),
                ),
                Text(
                  price,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              'Status: $status',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.accentAlt,
                  ),
            ),
            if (showActions) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {},
                      child: const Text('Detalhes'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: () {},
                      child: const Text('Preparar'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AuctionEntryCard extends StatelessWidget {
  const _AuctionEntryCard();
  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      child: InkWell(
        onTap: () => context.push('/auction'),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.accentContainer,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.storefront_rounded, color: AppColors.accent),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Leilão de Serviços Pesados',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Envie ofertas para polimento, cristalização e mais',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
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
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      authenticated: (user) => Scaffold(
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
                    user.storeName.substring(0, 1).toUpperCase(),
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
              user.storeName,
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
              icon: Icons.inventory_2_outlined,
              title: 'Meus Produtos',
              onTap: () => context.push('/products'),
            ),
            _ProfileMenuItem(
              icon: Icons.workspace_premium_outlined,
              title: 'Plano da Loja',
              onTap: () => context.push('/plan'),
            ),
            _ProfileMenuItem(
              icon: Icons.edit_outlined,
              title: 'Editar Perfil',
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.security_outlined,
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
      ),
      unauthenticated: () => const Center(
        child: Text('Não autenticado', style: TextStyle(color: AppColors.textPrimary)),
      ),
      error: (msg) => Center(
        child: Text(msg, style: const TextStyle(color: AppColors.error)),
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
        trailing: Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
        onTap: onTap,
      ),
    );
  }
}
