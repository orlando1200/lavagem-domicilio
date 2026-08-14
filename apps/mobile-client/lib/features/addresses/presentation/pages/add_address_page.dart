import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/addresses_repository.dart';

/// Formulario de cadastro de endereco (POST /addresses). Mesmos campos
/// de `checkout_page.dart`'s `_AddressStep`, agora persistindo de
/// verdade em vez de virar snapshot solto no checkout. Volta `true`
/// no pop quando concluido, pra quem chamou invalidar `addressesProvider`.
class AddAddressPage extends ConsumerStatefulWidget {
  const AddAddressPage({super.key});

  @override
  ConsumerState<AddAddressPage> createState() => _AddAddressPageState();
}

class _AddAddressPageState extends ConsumerState<AddAddressPage> {
  final _formKey = GlobalKey<FormState>();
  final _labelController = TextEditingController();
  final _streetController = TextEditingController();
  final _numberController = TextEditingController();
  final _complementController = TextEditingController();
  final _neighborhoodController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipCodeController = TextEditingController();

  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _labelController.dispose();
    _streetController.dispose();
    _numberController.dispose();
    _complementController.dispose();
    _neighborhoodController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipCodeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      await ref.read(addressesRepositoryProvider).create(
            label: _labelController.text.trim(),
            street: _streetController.text.trim(),
            number: _numberController.text.trim(),
            complement: _complementController.text.trim(),
            neighborhood: _neighborhoodController.text.trim(),
            city: _cityController.text.trim(),
            state: _stateController.text.trim().toUpperCase(),
            zipCode: _zipCodeController.text.trim(),
          );
      if (!mounted) return;
      Navigator.pop(context, true);
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
      appBar: AppBar(title: const Text('Adicionar Endereço')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: NeonSurface(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _labelController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                        labelText: 'Apelido (opcional, ex: Casa)'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _streetController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Rua'),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Informe a rua'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _numberController,
                          style: const TextStyle(color: AppColors.textPrimary),
                          decoration:
                              const InputDecoration(labelText: 'Número'),
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Obrigatório'
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: _complementController,
                          style: const TextStyle(color: AppColors.textPrimary),
                          decoration: const InputDecoration(
                              labelText: 'Complemento (opcional)'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _neighborhoodController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Bairro'),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Informe o bairro'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          controller: _cityController,
                          style: const TextStyle(color: AppColors.textPrimary),
                          decoration:
                              const InputDecoration(labelText: 'Cidade'),
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Obrigatório'
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _stateController,
                          maxLength: 2,
                          textCapitalization: TextCapitalization.characters,
                          style: const TextStyle(color: AppColors.textPrimary),
                          decoration: const InputDecoration(
                              labelText: 'UF', counterText: ''),
                          validator: (v) =>
                              (v == null || v.trim().length != 2) ? 'UF' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _zipCodeController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'CEP'),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Informe o CEP'
                        : null,
                  ),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      _errorMessage!,
                      style: const TextStyle(color: AppColors.error),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: AppColors.primaryDark),
                          )
                        : const Text('Salvar endereço'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
