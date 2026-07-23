import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/placeholder_page.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/home/presentation/pages/home_page.dart';
import 'features/orders/presentation/orders_list_page.dart';
import 'features/shop/presentation/pages/shop_page.dart';
import 'features/shop/presentation/pages/product_detail_page.dart';
import 'features/shop/presentation/pages/cart_page.dart';

void main() {
  runApp(const ProviderScope(child: GiucarApp()));
}

/// Entrypoint do app cliente GIUCAR Cyberpunk, conectado ao backend real
/// (login, home, pedidos, perfil e loja de acessorios). Demais features
/// legadas (aluguel de motos, veiculos, enderecos, engajamento completo,
/// etc.) permanecem fora do escopo desta fase e usam [PlaceholderPage].
class GiucarApp extends StatelessWidget {
  const GiucarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'GIUCAR',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: _router,
    );
  }
}

final GoRouter _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/orders',
      builder: (context, state) => const OrdersListPage(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const PlaceholderPage(title: 'Cadastro'),
    ),
    GoRoute(
      path: '/shop',
      builder: (context, state) => const ShopPage(),
    ),
    GoRoute(
      path: '/product/:id',
      builder: (context, state) => ProductDetailPage(
        productId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/cart',
      builder: (context, state) => const CartPage(),
    ),
    GoRoute(
      path: '/moto-rental',
      builder: (context, state) => const PlaceholderPage(title: 'Aluguel de Moto'),
    ),
    GoRoute(
      path: '/catalog',
      builder: (context, state) => const PlaceholderPage(title: 'Catálogo de Serviços'),
    ),
    GoRoute(
      path: '/vehicles',
      builder: (context, state) => const PlaceholderPage(title: 'Meus Veículos'),
    ),
    GoRoute(
      path: '/addresses',
      builder: (context, state) => const PlaceholderPage(title: 'Meus Endereços'),
    ),
    GoRoute(
      path: '/payment-history',
      builder: (context, state) => const PlaceholderPage(title: 'Histórico de Pagamentos'),
    ),
    GoRoute(
      path: '/engagement',
      builder: (context, state) => const PlaceholderPage(title: 'Engajamento'),
    ),
    GoRoute(
      path: '/quote',
      builder: (context, state) => const PlaceholderPage(title: 'Solicitar Orçamento'),
    ),
  ],
);
