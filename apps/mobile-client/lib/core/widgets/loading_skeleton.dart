import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Placeholder de carregamento (skeleton) usado em telas que aguardam
/// dados assincronos (perfil, pedidos, etc.), seguindo a paleta GIUCAR.
class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({
    super.key,
    this.height = 16,
    this.width,
    this.radius = 8,
  });

  final double height;
  final double? width;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width ?? double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppColors.border),
      ),
    );
  }
}
