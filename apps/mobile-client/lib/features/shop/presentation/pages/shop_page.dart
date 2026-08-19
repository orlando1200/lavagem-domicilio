import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../vehicles/presentation/providers/vehicles_provider.dart';
import '../../data/models/product_model.dart';
import '../../shop_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/selected_vehicle_provider.dart';
import '../widgets/compatibility_badge.dart';

/// Tela principal da loja B2C do cliente: catalogo real, categorias e
/// busca (filtro client-side sobre a primeira pagina do catalogo).
class ShopPage extends ConsumerStatefulWidget {
  const ShopPage({super.key});

  @override
  ConsumerState<ShopPage> createState() => _ShopPageState();
}

class _ShopPageState extends ConsumerState<ShopPage> {
  String? _selectedCategory;
  String _query = '';
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ProductModel> _filter(List<ProductModel> products) {
    var result = products;
    if (_selectedCategory != null) {
      result = result.where((p) => p.category == _selectedCategory).toList();
    }
    if (_query.trim().isNotEmpty) {
      final q = _query.toLowerCase();
      result = result
          .where((p) =>
              p.name.toLowerCase().contains(q) ||
              (p.description?.toLowerCase().contains(q) ?? false))
          .toList();
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final catalogAsync = ref.watch(catalogProvider);
    final cart = ref.watch(cartProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Loja de Acessórios'),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_rounded),
                onPressed: () => context.push('/cart'),
              ),
              if (cart.totalItems > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: const BoxDecoration(
                      color: AppColors.accent,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${cart.totalItems}',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: catalogAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  error.toString(),
                  style: const TextStyle(color: AppColors.error),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => ref.invalidate(catalogProvider),
                  child: const Text('Tentar novamente'),
                ),
              ],
            ),
          ),
        ),
        data: (allProducts) {
          final categories = allProducts
              .map((p) => p.category)
              .whereType<String>()
              .toSet()
              .toList()
            ..sort();
          final products = _filter(allProducts);

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: TextField(
                  controller: _searchController,
                  onChanged: (v) => setState(() => _query = v),
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Buscar produtos...',
                    prefixIcon: Icon(Icons.search_rounded, color: AppColors.textMuted),
                    suffixIcon: _query.isEmpty
                        ? null
                        : IconButton(
                            icon: Icon(Icons.close_rounded, color: AppColors.textMuted),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _query = '');
                            },
                          ),
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: _VehicleSelectorChip(),
              ),
              if (categories.isNotEmpty)
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _CategoryChip(
                        label: 'Todos',
                        selected: _selectedCategory == null,
                        onTap: () => setState(() => _selectedCategory = null),
                      ),
                      for (final category in categories)
                        Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: _CategoryChip(
                            label: category,
                            selected: _selectedCategory == category,
                            onTap: () => setState(() => _selectedCategory = category),
                          ),
                        ),
                    ],
                  ),
                ),
              const SizedBox(height: 8),
              Expanded(
                child: products.isEmpty
                    ? const _EmptyResults()
                    : GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 14,
                          crossAxisSpacing: 14,
                          childAspectRatio: 0.72,
                        ),
                        itemCount: products.length,
                        itemBuilder: (context, index) => _ProductCard(product: products[index]),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryContainer : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: selected ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

/// Cor determinística para o avatar de inicial, alternando entre os
/// dois tons da paleta (sem imagem/emoji no `Product` real).
Color _avatarColor(String id) => id.hashCode.isEven ? AppColors.primary : AppColors.accent;

class _ProductCard extends ConsumerWidget {
  const _ProductCard({required this.product});

  final ProductModel product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color = _avatarColor(product.id);

    return NeonSurface(
      radius: 18,
      child: InkWell(
        onTap: () => context.push('/product/${product.id}'),
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Center(
                  child: Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Center(
                      child: Text(
                        product.initial,
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: color,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                product.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Text(
                    'R\$ ${product.price.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                  const Spacer(),
                  CompatibilityBadge(compatibility: product.compatibility),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    textStyle: const TextStyle(fontSize: 12),
                  ),
                  onPressed: !product.inStock
                      ? null
                      : () async {
                          if (!await confirmAddIfNotCompatible(context, product)) return;
                          if (!context.mounted) return;
                          ref.read(cartProvider.notifier).add(product);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('${product.name} adicionado ao carrinho')),
                          );
                        },
                  child: Text(product.inStock ? 'Adicionar' : 'Esgotado'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Chip que mostra o veiculo selecionado (ou convite pra selecionar) e
/// abre um bottom sheet com `vehiclesProvider` pra trocar. A escolha
/// alimenta `selectedVehicleProvider`, que recalcula `compatibility` em
/// todo o catalogo automaticamente (ver `shop_provider.dart`).
class _VehicleSelectorChip extends ConsumerWidget {
  const _VehicleSelectorChip();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedVehicleProvider);

    return InkWell(
      onTap: () => _openPicker(context, ref),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected != null ? AppColors.primary : AppColors.border),
        ),
        child: Row(
          children: [
            Icon(Icons.directions_car_rounded, size: 18, color: selected != null ? AppColors.primary : AppColors.textMuted),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                selected != null
                    ? selected.displayName
                    : 'Selecionar veículo para ver compatibilidade',
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: selected != null ? AppColors.textPrimary : AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Icon(Icons.expand_more_rounded, size: 18, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }

  void _openPicker(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      builder: (context) => Consumer(
        builder: (context, ref, _) {
          final vehiclesAsync = ref.watch(vehiclesProvider);
          return SafeArea(
            child: vehiclesAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
              ),
              error: (error, stackTrace) => Padding(
                padding: const EdgeInsets.all(24),
                child: Text(error.toString(), style: const TextStyle(color: AppColors.error)),
              ),
              data: (vehicles) => Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ListTile(
                    leading: Icon(Icons.block_rounded, color: AppColors.textMuted),
                    title: const Text('Nenhum veículo específico', style: TextStyle(color: AppColors.textPrimary)),
                    onTap: () {
                      ref.read(selectedVehicleProvider.notifier).clear();
                      Navigator.pop(context);
                    },
                  ),
                  if (vehicles.isEmpty)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      child: Text(
                        'Você ainda não tem veículos cadastrados.',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  else
                    for (final vehicle in vehicles)
                      ListTile(
                        leading: const Icon(Icons.directions_car_rounded, color: AppColors.primary),
                        title: Text(vehicle.displayName, style: const TextStyle(color: AppColors.textPrimary)),
                        onTap: () {
                          ref.read(selectedVehicleProvider.notifier).select(vehicle);
                          Navigator.pop(context);
                        },
                      ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off_rounded, color: AppColors.textMuted, size: 48),
            const SizedBox(height: 12),
            Text(
              'Nenhum produto encontrado.',
              style: TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
