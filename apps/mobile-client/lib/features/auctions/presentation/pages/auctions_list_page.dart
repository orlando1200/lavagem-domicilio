import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../auctions_provider.dart';
import '../../data/models/auction_model.dart';
import '../../data/heavy_services.dart';

/// Lista de leiloes de servico pesado do cliente (GET /auctions/me), com
/// atalho para abrir um novo leilao.
class AuctionsListPage extends ConsumerWidget {
  const AuctionsListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auctionsAsync = ref.watch(myAuctionsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Leilão de Serviços Pesados')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/auctions/new'),
        icon: const Icon(Icons.add),
        label: const Text('Novo leilão'),
      ),
      body: auctionsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (error, stackTrace) => _AuctionsError(
          message: error.toString(),
          onRetry: () => ref.invalidate(myAuctionsProvider),
        ),
        data: (auctions) {
          if (auctions.isEmpty) {
            return const _AuctionsEmpty();
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(myAuctionsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: auctions.length,
              itemBuilder: (context, index) => _AuctionCard(auction: auctions[index]),
            ),
          );
        },
      ),
    );
  }
}

class _AuctionCard extends StatelessWidget {
  const _AuctionCard({required this.auction});

  final AuctionModel auction;

  Color get _statusColor {
    switch (auction.status) {
      case 'open':
        return AppColors.primary;
      case 'closed':
        return AppColors.accent;
      case 'cancelled':
      case 'expired':
        return AppColors.textMuted;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final services = auction.serviceIds.map(heavyServiceTitle).join(', ');

    return InkWell(
      onTap: () => context.push('/auctions/${auction.id}'),
      borderRadius: BorderRadius.circular(20),
      child: NeonSurface(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    auction.statusLabel,
                    style: TextStyle(
                      color: _statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              services.isEmpty ? 'Leilão de serviço pesado' : services,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${auction.bidsCount} ${auction.bidsCount == 1 ? 'oferta recebida' : 'ofertas recebidas'}',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class _AuctionsEmpty extends StatelessWidget {
  const _AuctionsEmpty();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.local_car_wash_outlined, color: AppColors.textMuted, size: 48),
            const SizedBox(height: 12),
            Text(
              'Você ainda não abriu nenhum leilão de serviço pesado.',
              style: TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _AuctionsError extends StatelessWidget {
  const _AuctionsError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, color: AppColors.error, size: 48),
            const SizedBox(height: 12),
            Text(message, style: const TextStyle(color: AppColors.error), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Tentar novamente')),
          ],
        ),
      ),
    );
  }
}
