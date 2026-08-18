import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/placeholder_page.dart';
import 'features/addresses/presentation/pages/add_address_page.dart';
import 'features/addresses/presentation/pages/addresses_page.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/home/presentation/pages/home_page.dart';
import 'features/orders/presentation/orders_list_page.dart';
import 'features/orders/presentation/pages/new_order_page.dart';
import 'features/orders/presentation/pages/order_detail_page.dart';
import 'features/shop/presentation/pages/shop_page.dart';
import 'features/shop/presentation/pages/product_detail_page.dart';
import 'features/shop/presentation/pages/cart_page.dart';
import 'features/shop/presentation/pages/checkout_page.dart';
import 'features/auctions/presentation/pages/auctions_list_page.dart';
import 'features/auctions/presentation/pages/create_auction_page.dart';
import 'features/auctions/presentation/pages/auction_detail_page.dart';
import 'features/engagement/presentation/pages/engagement_page.dart';
import 'features/vehicles/presentation/pages/add_vehicle_page.dart';
import 'features/vehicles/presentation/pages/vehicles_page.dart';
import 'features/profile/presentation/pages/edit_profile_page.dart';
import 'features/profile/presentation/pages/change_password_page.dart';
import 'features/auth/presentation/pages/register_page.dart';
import 'features/auth/presentation/pages/forgot_password_page.dart';
import 'features/auth/presentation/pages/reset_password_page.dart';

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
      path: '/orders/:id',
      builder: (context, state) => OrderDetailPage(
        orderId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterPage(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordPage(),
    ),
    GoRoute(
      path: '/reset-password',
      builder: (context, state) => const ResetPasswordPage(),
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
      path: '/checkout',
      builder: (context, state) => const CheckoutPage(),
    ),
    GoRoute(
      path: '/auctions',
      builder: (context, state) => const AuctionsListPage(),
    ),
    GoRoute(
      path: '/auctions/new',
      builder: (context, state) => const CreateAuctionPage(),
    ),
    GoRoute(
      path: '/auctions/:id',
      builder: (context, state) => AuctionDetailPage(
        auctionId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/moto-rental',
      builder: (context, state) =>
          const PlaceholderPage(title: 'Aluguel de Moto'),
    ),
    GoRoute(
      path: '/catalog',
      builder: (context, state) => const NewOrderPage(),
    ),
    GoRoute(
      path: '/vehicles',
      builder: (context, state) => const VehiclesPage(),
    ),
    GoRoute(
      path: '/vehicles/new',
      builder: (context, state) => const AddVehiclePage(),
    ),
    GoRoute(
      path: '/addresses',
      builder: (context, state) => const AddressesPage(),
    ),
    GoRoute(
      path: '/addresses/new',
      builder: (context, state) => const AddAddressPage(),
    ),
    GoRoute(
      path: '/payment-history',
      builder: (context, state) =>
          const PlaceholderPage(title: 'Histórico de Pagamentos'),
    ),
    GoRoute(
      path: '/engagement',
      builder: (context, state) => const EngagementPage(),
    ),
    GoRoute(
      path: '/quote',
      builder: (context, state) => const NewOrderPage(),
    ),
    GoRoute(
      path: '/profile/edit',
      builder: (context, state) => const EditProfilePage(),
    ),
    GoRoute(
      path: '/profile/change-password',
      builder: (context, state) => const ChangePasswordPage(),
    ),
  ],
);
