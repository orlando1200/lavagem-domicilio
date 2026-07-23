import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/deliveries/presentation/pages/delivery_orders_page.dart';
import 'features/home/presentation/pages/home_page.dart';
import 'features/orders/presentation/pages/active_order_page.dart';

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
  ],
);
