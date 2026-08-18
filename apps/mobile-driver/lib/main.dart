import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/register_page.dart';
import 'features/auth/presentation/pages/forgot_password_page.dart';
import 'features/auth/presentation/pages/reset_password_page.dart';
import 'features/deliveries/presentation/pages/delivery_orders_page.dart';
import 'features/documents/presentation/pages/documents_page.dart';
import 'features/home/presentation/pages/home_page.dart';
import 'features/orders/presentation/pages/active_order_page.dart';
import 'features/profile/presentation/pages/change_password_page.dart';
import 'features/profile/presentation/pages/bank_info_page.dart';
import 'features/notifications/presentation/pages/notifications_page.dart';
import 'features/auctions/presentation/pages/auctions_page.dart';
import 'features/auctions/presentation/pages/submit_bid_page.dart';
import 'features/shop/presentation/pages/shop_page.dart';
import 'features/shop/presentation/pages/product_detail_page.dart';
import 'features/shop/presentation/pages/cart_page.dart';
import 'features/shop/presentation/pages/checkout_page.dart';
import 'features/rental/presentation/pages/rental_page.dart';
import 'features/zones/presentation/pages/service_area_page.dart';

void main() {
  runApp(const ProviderScope(child: GiucarDriverApp()));
}

/// Entrypoint do app do lavador GIUCAR Cyberpunk.
///
/// As features de pedidos legadas encontradas com codigo-fonte
/// corrompido/truncado apos uma restauracao anterior do repositorio
/// permanecem isoladas em `_corrupted_quarantine/` (ver
/// docs/FASE9_CORRUPTED_MODULES.md); este app usa uma reconstrucao
/// funcional e autocontida em `lib/features/**`.
class GiucarDriverApp extends StatelessWidget {
  const GiucarDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'GIUCAR Pro',
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
      path: '/home',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/active-order',
      builder: (context, state) => const ActiveOrderPage(),
    ),
    GoRoute(
      path: '/deliveries',
      builder: (context, state) => const DeliveryOrdersPage(),
    ),
    GoRoute(
      path: '/documents',
      builder: (context, state) => const DocumentsPage(),
    ),
    GoRoute(
      path: '/auctions',
      builder: (context, state) => const AuctionsPage(),
    ),
    GoRoute(
      path: '/auctions/:id/bid',
      builder: (context, state) => SubmitBidPage(
        auctionId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/shop',
      builder: (context, state) => const ShopPage(),
    ),
    GoRoute(
      path: '/shop/product/:id',
      builder: (context, state) => ProductDetailPage(
        productId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/shop/cart',
      builder: (context, state) => const CartPage(),
    ),
    GoRoute(
      path: '/shop/checkout',
      builder: (context, state) => const CheckoutPage(),
    ),
    GoRoute(
      path: '/rental',
      builder: (context, state) => const RentalPage(),
    ),
    GoRoute(
      path: '/service-area',
      builder: (context, state) => const ServiceAreaPage(),
    ),
    GoRoute(
      path: '/profile/change-password',
      builder: (context, state) => const ChangePasswordPage(),
    ),
    GoRoute(
      path: '/profile/bank-info',
      builder: (context, state) => const BankInfoPage(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsPage(),
    ),
  ],
);
