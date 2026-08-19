import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/product_model.dart';

/// Pill de compatibilidade — nao mostra nada pra `unknown` (produto sem
/// regra cadastrada ou sem veiculo selecionado, o caso mais comum hoje),
/// pra nao virar ruido visual em todo o catalogo.
class CompatibilityBadge extends StatelessWidget {
  const CompatibilityBadge({super.key, required this.compatibility});

  final ProductCompatibility compatibility;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (compatibility) {
      ProductCompatibility.exactMatch => ('Compatível ✓', AppColors.primary),
      ProductCompatibility.universal => ('Universal', AppColors.accent),
      ProductCompatibility.notCompatible => ('Não compatível', AppColors.error),
      ProductCompatibility.unknown => (null, null),
    };
    if (label == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color!.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800),
      ),
    );
  }
}

/// Se o produto for `NOT_COMPATIBLE` com o veiculo selecionado, pede
/// confirmacao antes de adicionar ao carrinho/prosseguir. Pra `unknown`
/// (sem regra ou sem veiculo) segue direto — so bloqueia com confirmacao
/// quando ha um conflito real e conhecido.
Future<bool> confirmAddIfNotCompatible(BuildContext context, ProductModel product) async {
  if (product.compatibility != ProductCompatibility.notCompatible) {
    return true;
  }

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: AppColors.surface,
      title: const Text('Produto pode não ser compatível', style: TextStyle(color: AppColors.textPrimary)),
      content: Text(
        '"${product.name}" não é compatível com o veículo selecionado. Deseja adicionar mesmo assim?',
        style: TextStyle(color: AppColors.textSecondary),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
        FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Adicionar mesmo assim')),
      ],
    ),
  );

  return confirmed ?? false;
}
