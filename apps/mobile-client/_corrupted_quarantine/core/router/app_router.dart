import '../../features/orders/presentation/pages/payment_page.dart';
import '../../features/orders/presentation/pages/payment_history_page.dart';
import '../../features/orders/presentation/pages/chat_page.dart';
import '../../features/orders/presentation/pages/quote_checkout_page.dart';
import '../../features/engagement/presentation/pages/engagement_page.dart';
import '../../features/marketplace/presentation/pages/marketplace_page.dart';
import '../../features/marketplace/presentation/pages/cart_checkout_page.dart';










































































        builder: (context, state) =>
            ChatPage(orderId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/orders/:id/review',
        builder: (context, state) =>
            ReviewPage(orderId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/quote-checkout',
        builder: (context, state) => const QuoteCheckoutPage(),
      ),
      GoRoute(
        path: '/payment-history',
        builder: (context, state) => const PaymentHistoryPage(),
