import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Superficie reutilizavel com visual "neon card": fundo escuro translucido,
/// borda sutil e leve glow ciano, seguindo a identidade GIUCAR Cyberpunk.
class NeonSurface extends StatelessWidget {
  const NeonSurface({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.radius = 20,
    this.backgroundColor,
    this.borderColor,
    this.glowColor,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double radius;
  final Color? backgroundColor;
  final Color? borderColor;
  final Color? glowColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: borderColor ?? AppColors.border),
        boxShadow: [
          BoxShadow(
            color: glowColor ?? AppColors.glow,
            blurRadius: 24,
            spreadRadius: -10,
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: child,
    );
  }
}
