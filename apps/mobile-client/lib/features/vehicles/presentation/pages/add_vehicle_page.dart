import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/vehicle_model.dart';
import '../../data/vehicles_repository.dart';

/// Formulario de cadastro de veiculo (POST /vehicles). Volta `true` no
/// pop quando o cadastro e concluido com sucesso, pra quem chamou
/// invalidar `vehiclesProvider`.
class AddVehiclePage extends ConsumerStatefulWidget {
  const AddVehiclePage({super.key});

  @override
  ConsumerState<AddVehiclePage> createState() => _AddVehiclePageState();
}

class _AddVehiclePageState extends ConsumerState<AddVehiclePage> {
  final _formKey = GlobalKey<FormState>();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _colorController = TextEditingController();
  final _plateController = TextEditingController();

  VehicleType _type = VehicleType.carro;
  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _brandController.dispose();
    _modelController.dispose();
    _colorController.dispose();
    _plateController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      await ref.read(vehiclesRepositoryProvider).create(
            type: _type,
            brand: _brandController.text.trim(),
            model: _modelController.text.trim(),
            color: _colorController.text.trim(),
            plate: _plateController.text.trim().toUpperCase(),
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
      appBar: AppBar(title: const Text('Adicionar Veículo')),
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
                  DropdownButtonFormField<VehicleType>(
                    initialValue: _type,
                    dropdownColor: AppColors.surface,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Tipo'),
                    items: VehicleType.values
                        .map((t) =>
                            DropdownMenuItem(value: t, child: Text(t.label)))
                        .toList(),
                    onChanged: (value) {
                      if (value != null) setState(() => _type = value);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _brandController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Marca'),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Informe a marca'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _modelController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Modelo'),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Informe o modelo'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _colorController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration:
                        const InputDecoration(labelText: 'Cor (opcional)'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _plateController,
                    textCapitalization: TextCapitalization.characters,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Placa'),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Informe a placa'
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
                        : const Text('Salvar veículo'),
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
