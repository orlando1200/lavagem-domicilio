import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_scaffold.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../auth/presentation/providers/driver_auth_provider.dart';
import '../../../auth/presentation/providers/driver_auth_state.dart';
import '../../../orders/presentation/providers/driver_orders_provider.dart';

/// Home do app do lavador GIUCAR Pro.
///
/// Inclui toggle online/offline, estatisticas do dia, pedido atual (ou
/// lista de pedidos disponiveis quando online e sem pedido ativo) e fundo
/// com spots neon, seguindo a identidade GIUCAR Cyberpunk do app cliente.
class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _currentIndex = 0;

  final _pages = const [
    _HomeTab(),
    _OrdersTab(),
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
    final authState = ref.watch(driverAuthProvider);
    final ordersState = ref.watch(driverOrdersProvider);

    final userName = authState.maybeWhen(
      authenticated: (user) => user.name.split(' ').first,
      orElse: () => '',
    );

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: _HomeHeader(userName: userName, isOnline: ordersState.isOnline),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              _StatsGrid(stats: ordersState.stats),
              const SizedBox(height: 16),
              if (ordersState.activeOrder != null) ...[
                Text(
                  'Pedido atual',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 8),
                _ActiveOrderCard(order: ordersState.activeOrder!),
              ] else if (ordersState.isOnline) ...[
                Text(
                  'Pedidos disponíveis',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 8),
                if (ordersState.availableOrders.isEmpty)
                  const _EmptyOrdersState()
                else
                  ...ordersState.availableOrders.map(
                    (order) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _AvailableOrderCard(order: order),
                    ),
                  ),
              ] else
                const _OfflineHint(),
              const SizedBox(height: 16),
              const _ToolsSection(),
            ]),
          ),
        ),
      ],
    );
  }
}

/// Cabecalho da home com fusao organica entre spots neon (ciano/roxo) e a
/// cor base #050811, usando ShaderMask + RadialGradient + BlendMode.dstOut,
/// alem do toggle online/offline e saudacao ao lavador.
class _HomeHeader extends ConsumerWidget {
  const _HomeHeader({required this.userName, required this.isOnline});

  final String userName;
  final bool isOnline;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
              Row(
                children: [
                  Expanded(
                    child: Image.asset(
                      'assets/images/logo_giucar.png',
                      height: 40,
                      fit: BoxFit.contain,
                      alignment: Alignment.centerLeft,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.local_car_wash_rounded,
                        color: AppColors.primary,
                        size: 32,
                      ),
                    ),
                  ),
                  _OnlineToggle(isOnline: isOnline),
                ],
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
                    child: const Icon(Icons.local_car_wash_rounded, color: AppColors.textPrimary, size: 28),
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
                          'Pronto para mais lavagens hoje?',
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

class _OnlineToggle extends ConsumerWidget {
  const _OnlineToggle({required this.isOnline});

  final bool isOnline;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return InkWell(
      onTap: () => ref.read(driverOrdersProvider.notifier).toggleOnline(),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isOnline ? AppColors.primaryContainer : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isOnline ? AppColors.primary : AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isOnline ? AppColors.primary : AppColors.textMuted,
                boxShadow: isOnline
                    ? [BoxShadow(color: AppColors.glow, blurRadius: 8)]
                    : null,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              isOnline ? 'Online' : 'Offline',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isOnline ? AppColors.primary : AppColors.textMuted,
              ),
            ),
          ],
        ),
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

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});

  final DriverDailyStats stats;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _StatCard(value: 'R\$ ${stats.earningsToday.toStringAsFixed(0)}', label: 'Ganhos hoje'),
        _StatCard(value: '${stats.washesToday}', label: 'Lavagens'),
        _StatCard(value: stats.rating.toStringAsFixed(1), label: 'Avaliação'),
        _StatCard(value: '${stats.onlineHours.toStringAsFixed(0)}h', label: 'Online'),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      radius: 18,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
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

class _ActiveOrderCard extends ConsumerWidget {
  const _ActiveOrderCard({required this.order});

  final DriverOrder order;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return NeonSurface(
      child: InkWell(
        onTap: () => context.push('/active-order'),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    order.customerName,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                  ),
                  Text(
                    'R\$ ${order.price.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _OrderDetailLine(icon: Icons.directions_car_rounded, text: '${order.serviceName} · ${order.vehicle}'),
              const SizedBox(height: 4),
              _OrderDetailLine(icon: Icons.location_on_outlined, text: '${order.address} · ${order.distanceKm} km'),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () => context.push('/active-order'),
                      child: const Text('Iniciar lavagem'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => context.push('/active-order'),
                      child: const Text('Ver detalhes'),
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

class _AvailableOrderCard extends ConsumerWidget {
  const _AvailableOrderCard({required this.order});

  final DriverOrder order;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return NeonSurface(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.customerName,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                ),
                Text(
                  'R\$ ${order.price.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _OrderDetailLine(icon: Icons.directions_car_rounded, text: '${order.serviceName} · ${order.vehicle}'),
            const SizedBox(height: 4),
            _OrderDetailLine(
              icon: Icons.location_on_outlined,
              text: '${order.address} · ${order.distanceKm} km · ${order.etaMinutes} min',
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      ref.read(driverOrdersProvider.notifier).acceptOrder(order.id);
                    },
                    child: const Text('Aceitar'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      ref.read(driverOrdersProvider.notifier).rejectOrder(order.id);
                    },
                    child: const Text('Recusar'),
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

class _OrderDetailLine extends StatelessWidget {
  const _OrderDetailLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ),
      ],
    );
  }
}

class _EmptyOrdersState extends StatelessWidget {
  const _EmptyOrdersState();

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 32),
            const SizedBox(height: 8),
            Text(
              'Procurando pedidos próximos...',
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

class _OfflineHint extends StatelessWidget {
  const _OfflineHint();

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      borderColor: AppColors.accent,
      glowColor: AppColors.glowAccent,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            const Icon(Icons.power_settings_new_rounded, color: AppColors.accent),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Você está offline. Fique online para receber pedidos.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ToolsSection extends StatelessWidget {
  const _ToolsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Ferramentas do lavador',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ToolCard(
                icon: Icons.shopping_bag_outlined,
                label: 'Loja de produtos',
                sub: 'Repõe seu kit',
                onTap: () {},
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ToolCard(
                icon: Icons.two_wheeler_rounded,
                label: 'Aluguel de moto',
                sub: 'Mobilidade pro dia',
                onTap: () {},
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _ToolCard(
          icon: Icons.local_shipping_outlined,
          label: 'Entregas Loja do Lavador',
          sub: 'Aceite e entregue produtos comprados por outros lavadores',
          onTap: () => context.push('/deliveries'),
          fullWidth: true,
        ),
      ],
    );
  }
}

class _ToolCard extends StatelessWidget {
  const _ToolCard({
    required this.icon,
    required this.label,
    required this.sub,
    required this.onTap,
    this.fullWidth = false,
  });

  final IconData icon;
  final String label;
  final String sub;
  final VoidCallback onTap;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      radius: 16,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: fullWidth
              ? Row(
                  children: [
                    Icon(icon, color: AppColors.primary, size: 26),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            label,
                            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            sub,
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                  ],
                )
              : Column(
                  children: [
                    Icon(icon, color: AppColors.primary, size: 26),
                    const SizedBox(height: 8),
                    Text(
                      label,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      sub,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
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

// ── Pedidos ──────────────────────────────────────────────────────────────────

class _OrdersTab extends ConsumerWidget {
  const _OrdersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersState = ref.watch(driverOrdersProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: const Text('Pedidos')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (ordersState.activeOrder != null) ...[
            Text(
              'Pedido em andamento',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 8),
            _ActiveOrderCard(order: ordersState.activeOrder!),
            const SizedBox(height: 16),
          ],
          Text(
            'Pedidos disponíveis',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
          ),
          const SizedBox(height: 8),
          if (!ordersState.isOnline)
            const _OfflineHint()
          else if (ordersState.availableOrders.isEmpty)
            const _EmptyOrdersState()
          else
            ...ordersState.availableOrders.map(
              (order) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _AvailableOrderCard(order: order),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Perfil ───────────────────────────────────────────────────────────────────

class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(driverAuthProvider);
    final ordersState = ref.watch(driverOrdersProvider);

    return authState.when(
      initial: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      authenticated: (user) => _ProfileView(user: user, isOnline: ordersState.isOnline, ref: ref),
      unauthenticated: () => const Center(
        child: Text('Não autenticado', style: TextStyle(color: AppColors.textPrimary)),
      ),
      error: (msg) => Center(
        child: Text(msg, style: const TextStyle(color: AppColors.error)),
      ),
    );
  }
}

class _ProfileView extends StatelessWidget {
  const _ProfileView({required this.user, required this.isOnline, required this.ref});

  final DriverUser user;
  final bool isOnline;
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
            '⭐ ${user.rating.toStringAsFixed(1)} · ${user.reviewsCount} avaliações',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isOnline ? AppColors.primary : AppColors.textMuted,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                isOnline ? 'Online · recebendo pedidos' : 'Offline',
                style: TextStyle(
                  fontSize: 13,
                  color: isOnline ? AppColors.primary : AppColors.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _ProfileMenuItem(
            icon: Icons.account_balance_wallet_outlined,
            title: 'Minhas contas bancárias',
            onTap: () {},
          ),
          _ProfileMenuItem(
            icon: Icons.location_on_outlined,
            title: 'Área de atuação',
            onTap: () {},
          ),
          _ProfileMenuItem(
            icon: Icons.notifications_outlined,
            title: 'Notificações',
            onTap: () {},
          ),
          const SizedBox(height: 8),
          NeonSurface(
            child: ListTile(
              leading: const Icon(Icons.exit_to_app, color: AppColors.error),
              title: const Text('Sair', style: TextStyle(color: AppColors.error)),
              onTap: () async {
                await ref.read(driverAuthProvider.notifier).logout();
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
