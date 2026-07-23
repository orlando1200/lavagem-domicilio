import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Scaffold base do app GIUCAR Cyberpunk.
///
/// Fornece:
/// - fundo #050811 com spots radiais neon (ciano + roxo) fundidos via
///   [ShaderMask] + [BlendMode.dstOut], evitando cortes bruscos entre luzes;
/// - navegacao inferior flutuante (Home / Loja / Pedidos / Perfil) sobreposta
///   ao conteudo, com efeito "glass" neon.
class AppScaffold extends StatelessWidget {
  const AppScaffold({
    super.key,
    required this.body,
    this.currentIndex,
    this.onDestinationSelected,
    this.showNavBar = true,
  });

  final Widget body;
  final int? currentIndex;
  final ValueChanged<int>? onDestinationSelected;
  final bool showNavBar;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      extendBody: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const _RadialNeonBackdrop(),
          SafeArea(
            bottom: false,
            child: body,
          ),
          if (showNavBar && currentIndex != null)
            Positioned(
              left: 20,
              right: 20,
              bottom: 20,
              child: _FloatingNavBar(
                currentIndex: currentIndex!,
                onDestinationSelected: onDestinationSelected,
              ),
            ),
        ],
      ),
    );
  }
}

/// Fundo radial com fusao organica entre spots neon e a cor base #050811.
///
/// Usa [ShaderMask] com [RadialGradient] + [BlendMode.dstOut] para "apagar"
/// gradualmente cada spot em direcao as bordas, criando uma transicao suave
/// (sem cortes bruscos) compativel com CanvasKit/WebGL.
class _RadialNeonBackdrop extends StatelessWidget {
  const _RadialNeonBackdrop();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: Stack(
        fit: StackFit.expand,
        children: [
          _NeonSpot(
            alignment: const Alignment(-0.9, -1.0),
            color: AppColors.primary,
            size: 420,
          ),
          _NeonSpot(
            alignment: const Alignment(1.1, -0.6),
            color: AppColors.accent,
            size: 380,
          ),
          _NeonSpot(
            alignment: const Alignment(0.9, 1.2),
            color: AppColors.primaryAlt,
            size: 340,
          ),
        ],
      ),
    );
  }
}

/// Um unico "spot" de luz neon fundido organicamente ao fundo via
/// ShaderMask (RadialGradient + BlendMode.dstOut).
class _NeonSpot extends StatelessWidget {
  const _NeonSpot({
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
                color.withValues(alpha: 0.55),
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

class _FloatingNavBar extends StatelessWidget {
  const _FloatingNavBar({
    required this.currentIndex,
    required this.onDestinationSelected,
  });

  final int currentIndex;
  final ValueChanged<int>? onDestinationSelected;

  static const _items = [
    (icon: Icons.home_rounded, label: 'Home'),
    (icon: Icons.storefront_rounded, label: 'Loja'),
    (icon: Icons.receipt_long_rounded, label: 'Pedidos'),
    (icon: Icons.person_rounded, label: 'Perfil'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.glow,
            blurRadius: 28,
            spreadRadius: -8,
          ),
        ],
      ),
      child: Row(
        children: List.generate(_items.length, (i) {
          final selected = i == currentIndex;
          final item = _items[i];
          return Expanded(
            child: _NavItem(
              icon: item.icon,
              label: item.label,
              selected: selected,
              onTap: () => onDestinationSelected?.call(i),
            ),
          );
        }),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryContainer : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: selected ? AppColors.primary : AppColors.textMuted,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: selected ? AppColors.primary : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
