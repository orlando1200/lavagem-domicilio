import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/store_product.dart';
import '../../data/products_repository.dart';
import '../../products_provider.dart';

/// Edicao de um produto ja cadastrado (PATCH /stores/:id/products/:id).
/// Mesmos campos de `product_form_page.dart` (sem foto/banner de
/// sugestao, que so fazem sentido na criacao), mais um switch de
/// ativar/pausar quando o produto ja foi aprovado.
class ProductEditPage extends ConsumerStatefulWidget {
  const ProductEditPage({super.key, required this.product});

  final StoreProduct product;

  @override
  ConsumerState<ProductEditPage> createState() => _ProductEditPageState();
}

class _ProductEditPageState extends ConsumerState<ProductEditPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _priceController;
  late final TextEditingController _stockController;
  late CatalogTarget _catalogTarget;
  late bool _isActive;

  bool _submitting = false;
  String? _errorMessage;

  bool get _canToggleStatus =>
      widget.product.status == 'active' || widget.product.status == 'inactive';

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.product.name);
    _descriptionController =
        TextEditingController(text: widget.product.description ?? '');
    _priceController =
        TextEditingController(text: widget.product.price.toStringAsFixed(2));
    _stockController =
        TextEditingController(text: widget.product.stockQuantity.toString());
    _catalogTarget = widget.product.catalogTarget;
    _isActive = widget.product.status == 'active';
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final authState = ref.read(authProvider);
    final storeId = authState.maybeWhen(
        authenticated: (user) => user.storeId, orElse: () => null);
    if (storeId == null) {
      setState(() => _errorMessage = 'Loja não encontrada para este usuário.');
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });
    try {
      await ref.read(productsRepositoryProvider).updateProduct(
            storeId: storeId,
            productId: widget.product.id,
            name: _titleController.text.trim(),
            description: _descriptionController.text.trim(),
            price: double.parse(_priceController.text.replaceAll(',', '.')),
            stockQuantity: int.parse(_stockController.text),
            catalogTarget: _catalogTarget,
            status:
                _canToggleStatus ? (_isActive ? 'active' : 'inactive') : null,
          );
      if (!mounted) return;
      ref.invalidate(storeProductsProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Produto atualizado!')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Editar produto')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_canToggleStatus) ...[
                  NeonSurface(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Produto ativo',
                          style: TextStyle(color: AppColors.textPrimary)),
                      subtitle: Text(
                        _isActive
                            ? 'Visível no catálogo'
                            : 'Pausado — não aparece no catálogo',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                      activeColor: AppColors.primary,
                      value: _isActive,
                      onChanged: (v) => setState(() => _isActive = v),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _titleController,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(
                    labelText: 'Título do produto',
                    prefixIcon: Icon(Icons.label_outline_rounded,
                        color: AppColors.primary),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Informe o título do produto';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 3,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(
                    labelText: 'Descrição',
                    prefixIcon: Icon(Icons.description_outlined,
                        color: AppColors.primary),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Informe a descrição';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _priceController,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Preço (R\$)',
                          prefixIcon: Icon(Icons.attach_money_rounded,
                              color: AppColors.primary),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Informe o preço';
                          }
                          if (double.tryParse(value.replaceAll(',', '.')) ==
                              null) {
                            return 'Preço inválido';
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _stockController,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Estoque',
                          prefixIcon: Icon(Icons.inventory_2_outlined,
                              color: AppColors.primary),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Informe o estoque';
                          }
                          if (int.tryParse(value) == null) {
                            return 'Estoque inválido';
                          }
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  'Destino do catálogo',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 12),
                ...CatalogTarget.values.map(
                  (target) => _CatalogTargetTile(
                    target: target,
                    selected: _catalogTarget == target,
                    onTap: () => setState(() => _catalogTarget = target),
                  ),
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    style: const TextStyle(color: AppColors.error),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.primaryDark),
                        )
                      : const Text('Salvar alterações'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CatalogTargetTile extends StatelessWidget {
  const _CatalogTargetTile(
      {required this.target, required this.selected, required this.onTap});

  final CatalogTarget target;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 12),
      borderColor: selected ? AppColors.primary : AppColors.border,
      glowColor:
          selected ? AppColors.glow : AppColors.glow.withValues(alpha: 0.08),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(
                selected
                    ? Icons.radio_button_checked_rounded
                    : Icons.radio_button_off_rounded,
                color: selected ? AppColors.primary : AppColors.textMuted,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  target.label,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
