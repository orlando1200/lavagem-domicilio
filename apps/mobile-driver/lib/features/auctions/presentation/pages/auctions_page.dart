import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../../core/widgets/countdown_chip.dart';
import '../../auctions_provider.dart';
import '../../data/driver_profile_repository.dart';
import '../../data/models/auction_models.dart';
import '../../data/heavy_services.dart';

/// Leilao de servicos pesados, do lado da loja de carwash: leiloes
/// abertos disponiveis pra pujar + lista das proprias ofertas enviadas.
///
/// So lojas com `DriverProfile` `driverType = CARWASH_SHOP`,
/// `HEAVY_SERVICE` em `allowedServices` e `status = active` participam —
/// esta tela cuida tambem da ativacao desse perfil quando ele ainda nao
/// existe ou esta pendente de aprovacao.
class AuctionsPage extends ConsumerWidget {
  const AuctionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myDriverProfileProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Leilão de Serviços Pesados')),
      body: profileAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(error.toString(), style: const TextStyle(color: AppColors.error)),
          ),
        ),
        data: (profile) {
          if (profile == null || !profile.isCarwashShop) {
            return _ActivationPrompt(hasExistingProfile: profile != null);
          }
          if (!profile.isEligibleForAuctions) {
            return const _PendingApprovalNotice();
          }
          return const _AuctionsTabs();
        },
      ),
    );
  }
}

class _ActivationPrompt extends ConsumerStatefulWidget {
  const _ActivationPrompt({required this.hasExistingProfile});

  final bool hasExistingProfile;

  @override
  ConsumerState<_ActivationPrompt> createState() => _ActivationPromptState();
}

class _ActivationPromptState extends ConsumerState<_ActivationPrompt> {
  bool _submitting = false;
  String? _errorMessage;

  Future<void> _activate() async {
    setState(() {
      _submitting = true;
      _errorMessage = null;
    });
    try {
      await ref
          .read(driverProfileRepositoryProvider)
          .activateCarwashShop(hasExistingProfile: widget.hasExistingProfile);
      ref.invalidate(myDriverProfileProvider);
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: NeonSurface(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('🏪', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 12),
              const Text(
                'Torne-se uma Loja de Carwash',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Ative o modo Loja de Carwash para receber e enviar ofertas nos leilões de '
                'serviço pesado (polimento, cristalização, funilaria, tapeçaria e mais) '
                'solicitados por clientes na sua região.',
                style: TextStyle(color: AppColors.textSecondary, height: 1.5),
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 12),
                Text(_errorMessage!, style: const TextStyle(color: AppColors.error)),
              ],
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _submitting ? null : _activate,
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryDark),
                        )
                      : const Text('Ativar modo Loja de Carwash'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PendingApprovalNotice extends StatelessWidget {
  const _PendingApprovalNotice();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.hourglass_top_rounded, color: AppColors.accent, size: 48),
            const SizedBox(height: 12),
            Text(
              'Seu cadastro como Loja de Carwash está em análise. Assim que for aprovado, '
              'você poderá enviar ofertas nos leilões de serviço pesado.',
              style: TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _AuctionsTabs extends StatefulWidget {
  const _AuctionsTabs();

  @override
  State<_AuctionsTabs> createState() => _AuctionsTabsState();
}

class _AuctionsTabsState extends State<_AuctionsTabs> with SingleTickerProviderStateMixin {
  late final TabController _tabController = TabController(length: 2, vsync: this);

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Disponíveis'),
            Tab(text: 'Minhas ofertas'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: const [_AvailableAuctionsTab(), _MyBidsTab()],
          ),
        ),
      ],
    );
  }
}

class _AvailableAuctionsTab extends ConsumerWidget {
  const _AvailableAuctionsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auctionsAsync = ref.watch(availableAuctionsProvider);

    return auctionsAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
      error: (error, stackTrace) => Center(
        child: Text(error.toString(), style: const TextStyle(color: AppColors.error)),
      ),
      data: (auctions) {
        if (auctions.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Nenhum leilão aberto na sua região no momento.',
                style: TextStyle(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.invalidate(availableAuctionsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: auctions.length,
            itemBuilder: (context, index) => _AvailableAuctionCard(auction: auctions[index]),
          ),
        );
      },
    );
  }
}

class _AvailableAuctionCard extends StatelessWidget {
  const _AvailableAuctionCard({required this.auction});

  final AvailableAuctionModel auction;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (auction.photos.isNotEmpty) ...[
            SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: auction.photos.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) => ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    auction.photos[index],
                    width: 100,
                    height: 80,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 100,
                      height: 80,
                      color: AppColors.border,
                      child: Icon(Icons.broken_image_outlined, color: AppColors.textMuted),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  auction.serviceIds.map(heavyServiceTitle).join(', '),
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
              ),
              if (auction.deadline != null) CountdownChip(deadline: auction.deadline!),
            ],
          ),
          if (auction.description != null && auction.description!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              auction.description!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
            ),
          ],
          const SizedBox(height: 6),
          Text(
            [
              '${auction.bidsCount} ${auction.bidsCount == 1 ? 'oferta enviada' : 'ofertas enviadas'}',
              if (auction.maxBudget != null) 'orçamento inicial R\$ ${auction.maxBudget!.toStringAsFixed(2)}',
            ].join(' · '),
            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => context.push('/auctions/${auction.id}/bid'),
              child: const Text('Enviar oferta'),
            ),
          ),
        ],
      ),
    );
  }
}

class _MyBidsTab extends ConsumerWidget {
  const _MyBidsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bidsAsync = ref.watch(myBidsProvider);

    return bidsAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
      error: (error, stackTrace) => Center(
        child: Text(error.toString(), style: const TextStyle(color: AppColors.error)),
      ),
      data: (bids) {
        if (bids.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Você ainda não enviou nenhuma oferta.',
                style: TextStyle(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.invalidate(myBidsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: bids.length,
            itemBuilder: (context, index) => _MyBidCard(bid: bids[index]),
          ),
        );
      },
    );
  }
}

class _MyBidCard extends StatelessWidget {
  const _MyBidCard({required this.bid});

  final MyBidModel bid;

  Color get _statusColor {
    switch (bid.status) {
      case 'accepted':
        return AppColors.primary;
      case 'rejected':
        return AppColors.textMuted;
      default:
        return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  bid.auctionServiceIds.map(heavyServiceTitle).join(', '),
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                'R\$ ${bid.amount.toStringAsFixed(2)}',
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'prazo ${bid.durationHours}h · garantia ${bid.warrantyDays} dias',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 8),
          Text(
            bid.statusLabel,
            style: TextStyle(color: _statusColor, fontWeight: FontWeight.w700, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
