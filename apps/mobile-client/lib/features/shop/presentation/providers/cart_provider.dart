import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/product_model.dart';

/// Item de carrinho: produto + quantidade selecionada.
class CartItem {
  const CartItem({required this.product, required this.quantity});

  final ProductModel product;
  final int quantity;

  double get subtotal => product.price * quantity;

  CartItem copyWith({int? quantity}) {
    return CartItem(
      product: product,
      quantity: quantity ?? this.quantity,
    );
  }
}

/// Estado do carrinho da loja B2C.
class CartState {
  const CartState({this.items = const []});

  final List<CartItem> items;

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => items.fold(0.0, (sum, item) => sum + item.subtotal);

  /// Frete simbólico (mock): gratis acima de R$ 150, senão R$ 14,90.
  double get shipping => items.isEmpty || subtotal >= 150 ? 0.0 : 14.90;

  double get total => subtotal + shipping;

  bool get isEmpty => items.isEmpty;
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(const CartState());

  void add(ProductModel product, {int quantity = 1}) {
    final index = state.items.indexWhere((i) => i.product.id == product.id);
    if (index == -1) {
      state = CartState(items: [...state.items, CartItem(product: product, quantity: quantity)]);
      return;
    }
    final updated = [...state.items];
    updated[index] = updated[index].copyWith(quantity: updated[index].quantity + quantity);
    state = CartState(items: updated);
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    final updated = state.items
        .map((i) => i.product.id == productId ? i.copyWith(quantity: quantity) : i)
        .toList();
    state = CartState(items: updated);
  }

  void removeItem(String productId) {
    state = CartState(items: state.items.where((i) => i.product.id != productId).toList());
  }

  void clear() {
    state = const CartState();
  }
}
