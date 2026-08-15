import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/register_page.dart';
import 'features/auth/presentation/providers/auth_provider.dart';
import 'features/auth/presentation/providers/auth_state.dart';
import 'features/home/presentation/pages/home_page.dart';
import 'features/orders/presentation/pages/orders_list_page.dart';
import 'features/plans/presentation/pages/plan_page.dart';
import 'features/products/data/models/store_product.dart';
import 'features/products/presentation/pages/product_edit_page.dart';
import 'features/products/presentation/pages/product_form_page.dart';
import 'features/products/presentation/pages/products_list_page.dart';
import 'features/profile/presentation/pages/edit_profile_page.dart';

void main() {
  runApp(const ProviderScope(child: GiucarLojistaApp()));
}

/// Entrypoint do Portal do Lojista GIUCAR Cyberpunk.
class GiucarLojistaApp extends ConsumerWidget {
  const GiucarLojistaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(_routerProvider);

    return MaterialApp.router(
      title: 'GIUCAR - Lojista',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: router,
    );
  }
}

final _routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    refreshListenable: _AuthRefreshNotifier(ref),
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuthenticated = authState is AuthAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (!isAuthenticated && !isAuthRoute) {
        return '/login';
      }
      if (isAuthenticated && isAuthRoute) {
        return '/home';
      }
      return null;
    },
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
        path: '/home',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/products',
        builder: (context, state) => const ProductsListPage(),
      ),
      GoRoute(
        path: '/products/new',
        builder: (context, state) => const ProductFormPage(),
      ),
      GoRoute(
        path: '/products/edit',
        builder: (context, state) => ProductEditPage(
          product: state.extra as StoreProduct,
        ),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersListPage(),
      ),
      GoRoute(
        path: '/plan',
        builder: (context, state) => const PlanPage(),
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfilePage(),
      ),
    ],
  );
});

/// Notifica o [GoRouter] quando o estado de autenticação muda, permitindo
/// que o `redirect` reavalie a rota atual (ex.: apos login/logout).
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(this.ref) {
    ref.listen(authProvider, (previous, next) {
      notifyListeners();
    });
  }

  final Ref ref;
}
