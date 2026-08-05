import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../auctions_provider.dart';
import '../../data/auctions_repository.dart';

/// Formulario de envio de puja (valor, prazo, garantia, mensagem e fotos)
/// para um leilao aberto (POST /auctions/:id/bids).
class SubmitBidPage extends ConsumerStatefulWidget {
  const SubmitBidPage({super.key, required this.auctionId});

  final String auctionId;

  @override
  ConsumerState<SubmitBidPage> createState() => _SubmitBidPageState();
}

class _SubmitBidPageState extends ConsumerState<SubmitBidPage> {
  final _amountController = TextEditingController();
  final _durationController = TextEditingController();
  final _warrantyController = TextEditingController();
  final _messageController = TextEditingController();
  final _photoUrlController = TextEditingController();
  final List<String> _photos = [];
  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _amountController.dispose();
    _durationController.dispose();
    _warrantyController.dispose();
    _messageController.dispose();
    _photoUrlController.dispose();
    super.dispose();
  }

  void _addPhotoUrl() {
    final url = _photoUrlController.text.trim();
    if (url.isEmpty) return;
    setState(() {
      _photos.add(url);
      _photoUrlController.clear();
    });
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amountController.text.replaceAll(',', '.'));
    final duration = int.tryParse(_durationController.text);
    final warranty = int.tryParse(_warrantyController.text);

    if (amount == null || duration == null || warranty == null) {
      setState(() => _errorMessage = 'Preencha valor, prazo e garantia com números válidos.');
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      await ref.read(auctionsRepositoryProvider).submitBid(
            widget.auctionId,
            amount: amount,
            durationHours: duration,
            warrantyDays: warranty,
            message: _messageController.text.trim().isEmpty ? null : _messageController.text.trim(),
            photos: _photos.isEmpty ? null : _photos,
          );

      ref.invalidate(availableAuctionsProvider);
      ref.invalidate(myBidsProvider);

      if (mounted) context.pop();
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Enviar Oferta')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Valor',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(hintText: 'R\$', prefixText: 'R\$ '),
            ),
            const SizedBox(height: 16),
            const Text(
              'Prazo de execução, em horas',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _durationController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: 'Ex.: 48'),
            ),
            const SizedBox(height: 16),
            const Text(
              'Garantia, em dias',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _warrantyController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: 'Ex.: 30'),
            ),
            const SizedBox(height: 16),
            const Text(
              'Mensagem (opcional)',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _messageController,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Diferenciais da sua loja, materiais usados etc.'),
            ),
            const SizedBox(height: 16),
            const Text(
              'Fotos (opcional, link)',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _photoUrlController,
                    decoration: const InputDecoration(hintText: 'https://...'),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _addPhotoUrl,
                  icon: const Icon(Icons.add_circle, color: AppColors.primary),
                ),
              ],
            ),
            if (_photos.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _photos
                    .map(
                      (url) => Chip(
                        label: Text(url, overflow: TextOverflow.ellipsis),
                        onDeleted: () => setState(() => _photos.remove(url)),
                      ),
                    )
                    .toList(),
              ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Text(_errorMessage!, style: const TextStyle(color: AppColors.error)),
            ],
            const SizedBox(height: 24),
            NeonSurface(
              padding: const EdgeInsets.all(14),
              child: Text(
                'Sua oferta é comparada com as de outras lojas por preço, prazo, garantia e '
                'sua reputação. O cliente escolhe a melhor.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryDark),
                      )
                    : const Text('Enviar oferta'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
