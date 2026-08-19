import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../../core/widgets/countdown_chip.dart';
import '../../auctions_provider.dart';
import '../../data/auctions_repository.dart';
import '../../data/models/auction_model.dart';
import '../../data/heavy_services.dart';

/// Detalhe de um leilao: servicos solicitados e ofertas recebidas,
/// rankeadas por preco/prazo/garantia/reputacao (GET /auctions/me/:id).
/// Cliente aceita a oferta escolhida ou cancela o leilao enquanto estiver
/// aberto.
class AuctionDetailPage extends ConsumerStatefulWidget {
  const AuctionDetailPage({super.key, required this.auctionId});

  final String auctionId;

  @override
  ConsumerState<AuctionDetailPage> createState() => _AuctionDetailPageState();
}

class _AuctionDetailPageState extends ConsumerState<AuctionDetailPage> {
  bool _busy = false;
  String? _errorMessage;

  Future<void> _acceptBid(String bidId) async {
    setState(() {
      _busy = true;
      _errorMessage = null;
    });
    try {
      await ref.read(auctionsRepositoryProvider).acceptBid(widget.auctionId, bidId);
      ref.invalidate(auctionDetailProvider(widget.auctionId));
      ref.invalidate(myAuctionsProvider);
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancelAuction() async {
    setState(() {
      _busy = true;
      _errorMessage = null;
    });
    try {
      await ref.read(auctionsRepositoryProvider).cancelAuction(widget.auctionId);
      ref.invalidate(auctionDetailProvider(widget.auctionId));
      ref.invalidate(myAuctionsProvider);
      if (mounted) context.pop();
    } catch (error) {
      setState(() {
        _errorMessage = error.toString();
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auctionAsync = ref.watch(auctionDetailProvider(widget.auctionId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Leilão de Serviço Pesado')),
      body: auctionAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString(),
              style: const TextStyle(color: AppColors.error),
              textAlign: TextAlign.center,
            ),
          ),
        ),
        data: (auction) {
          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _AuctionSummaryCard(auction: auction),
                const SizedBox(height: 20),
                Text(
                  'Ofertas recebidas',
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                if (auction.bids.isEmpty)
                  Text(
                    'Nenhuma oferta recebida ainda. As lojas de carwash cadastradas na sua '
                    'região serão notificadas.',
                    style: TextStyle(color: AppColors.textSecondary),
                  )
                else
                  ...auction.bids.map(
                    (bid) => _BidCard(
                      bid: bid,
                      canAccept: auction.isOpen && !_busy,
                      onAccept: () => _acceptBid(bid.id),
                    ),
                  ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Text(_errorMessage!, style: const TextStyle(color: AppColors.error)),
                ],
                if (auction.isOpen) ...[
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _busy ? null : _cancelAuction,
                      child: const Text('Cancelar leilão'),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _AuctionSummaryCard extends StatelessWidget {
  const _AuctionSummaryCard({required this.auction});

  final AuctionDetailModel auction;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      padding: const EdgeInsets.all(16),
      backgroundColor: AppColors.primaryContainer,
      borderColor: AppColors.primary.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (auction.photos.isNotEmpty) ...[
            SizedBox(
              height: 96,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: auction.photos.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) => ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    auction.photos[index],
                    width: 120,
                    height: 96,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 120,
                      height: 96,
                      color: AppColors.border,
                      child: Icon(Icons.broken_image_outlined, color: AppColors.textMuted),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          Row(
            children: [
              Expanded(
                child: Text(
                  auction.serviceIds.map(heavyServiceTitle).join(', '),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
              if (auction.isOpen && auction.deadline != null)
                CountdownChip(deadline: auction.deadline!),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            auction.statusLabelText,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          if (auction.maxBudget != null) ...[
            const SizedBox(height: 4),
            Text(
              'Orçamento máximo: R\$ ${auction.maxBudget!.toStringAsFixed(2)}',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
          ],
          if (auction.description != null && auction.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              auction.description!,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
            ),
          ],
        ],
      ),
    );
  }
}

extension on AuctionDetailModel {
  String get statusLabelText {
    switch (status) {
      case 'open':
        return 'Aberto · lojas de carwash cadastradas podem enviar ofertas';
      case 'closed':
        return 'Fechado · você já aceitou uma oferta';
      case 'cancelled':
        return 'Cancelado';
      case 'expired':
        return 'Expirado';
      default:
        return status;
    }
  }
}

class _BidCard extends StatelessWidget {
  const _BidCard({required this.bid, required this.canAccept, required this.onAccept});

  final AuctionBidModel bid;
  final bool canAccept;
  final VoidCallback onAccept;

  @override
  Widget build(BuildContext context) {
    final isTopRanked = bid.rank == 1;
    final isAccepted = bid.status == 'accepted';

    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      borderColor: isTopRanked || isAccepted ? AppColors.primary : AppColors.border,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('🏪', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  bid.supplierName,
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
              ),
              if (bid.rank != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: (isTopRanked ? AppColors.primary : AppColors.textMuted).withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'oferta #${bid.rank}',
                    style: TextStyle(
                      color: isTopRanked ? AppColors.primary : AppColors.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            [
              if (bid.supplierRating != null) '⭐ ${bid.supplierRating!.toStringAsFixed(1)}',
              'prazo ${bid.durationHours}h',
              'garantia ${bid.warrantyDays} dias',
            ].join(' · '),
            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
          if (bid.message != null && bid.message!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(bid.message!, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                'R\$ ${bid.amount.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              if (isAccepted)
                const Text('Aceita ✓', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700))
              else if (canAccept)
                FilledButton(
                  onPressed: onAccept,
                  child: Text('Aceitar oferta #${bid.rank ?? ''}'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
