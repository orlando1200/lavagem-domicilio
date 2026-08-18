import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../auctions/data/driver_profile_repository.dart';
import '../../../auctions/data/models/driver_profile_model.dart';

/// Dados bancarios/PIX do lavador (PATCH /driver-profiles/me/bank-info),
/// usados nos repasses (`Payout`). Preenchimento parcial permitido.
class BankInfoPage extends ConsumerStatefulWidget {
  const BankInfoPage({super.key});

  @override
  ConsumerState<BankInfoPage> createState() => _BankInfoPageState();
}

class _BankInfoPageState extends ConsumerState<BankInfoPage> {
  final _pixKeyTypeController = TextEditingController();
  final _pixKeyController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _agencyController = TextEditingController();
  final _accountNumberController = TextEditingController();

  bool _loading = true;
  bool _submitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await ref.read(driverProfileRepositoryProvider).fetchMyProfile();
      _fillFrom(profile);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _fillFrom(DriverProfileModel? profile) {
    if (profile == null) return;
    _pixKeyTypeController.text = profile.pixKeyType ?? '';
    _pixKeyController.text = profile.pixKey ?? '';
    _bankNameController.text = profile.bankName ?? '';
    _agencyController.text = profile.agency ?? '';
    _accountNumberController.text = profile.accountNumber ?? '';
  }

  @override
  void dispose() {
    _pixKeyTypeController.dispose();
    _pixKeyController.dispose();
    _bankNameController.dispose();
    _agencyController.dispose();
    _accountNumberController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _errorMessage = null;
    });
    try {
      await ref.read(driverProfileRepositoryProvider).updateBankInfo(
            pixKeyType: _pixKeyTypeController.text.trim(),
            pixKey: _pixKeyController.text.trim(),
            bankName: _bankNameController.text.trim(),
            agency: _agencyController.text.trim(),
            accountNumber: _accountNumberController.text.trim(),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Dados bancários salvos com sucesso!')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Minhas contas bancárias')),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: NeonSurface(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Usados para receber seus repasses. Preencha o quanto conseguir agora — pode completar depois.',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _pixKeyTypeController,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Tipo de chave PIX (CPF, e-mail, telefone, aleatória)',
                          prefixIcon: Icon(Icons.qr_code_rounded, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _pixKeyController,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Chave PIX',
                          prefixIcon: Icon(Icons.pix_rounded, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _bankNameController,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Banco',
                          prefixIcon: Icon(Icons.account_balance_outlined, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _agencyController,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Agência',
                          prefixIcon: Icon(Icons.numbers_rounded, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _accountNumberController,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Número da conta',
                          prefixIcon: Icon(Icons.credit_card_outlined, color: AppColors.primary),
                        ),
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 16),
                        Text(_errorMessage!, style: const TextStyle(color: AppColors.error), textAlign: TextAlign.center),
                      ],
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: _submitting ? null : _submit,
                        child: _submitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryDark),
                              )
                            : const Text('Salvar'),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
