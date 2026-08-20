import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/plate_lookup_model.dart';
import '../../data/models/vehicle_model.dart';
import '../../data/vehicles_repository.dart';
import '../providers/vehicles_provider.dart';
import '../widgets/plate_lookup_widgets.dart';

/// Estados do fluxo de busca por placa (onboarding estilo Webmotors):
/// Idle -> Loading -> Found | NotFound | Error. `notFound`/`error` nao
/// bloqueiam o cadastro — o formulario sempre pode ser preenchido
/// manualmente.
enum _PlateLookupStatus { idle, loading, found, notFound, error }

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
  final _renavamController = TextEditingController();

  VehicleType _type = VehicleType.carro;
  CarSize? _size;
  bool _submitting = false;
  String? _errorMessage;

  String? _catalogBrandId;
  String? _catalogModelId;
  String? _catalogYearId;

  _PlateLookupStatus _plateLookupStatus = _PlateLookupStatus.idle;
  PlateLookupResult? _plateLookupResult;
  String? _plateLookupErrorMessage;
  bool _manualOverride = false;

  @override
  void initState() {
    super.initState();
    _plateController.addListener(_onPlateEdited);
  }

  @override
  void dispose() {
    _plateController.removeListener(_onPlateEdited);
    _brandController.dispose();
    _modelController.dispose();
    _colorController.dispose();
    _plateController.dispose();
    _renavamController.dispose();
    super.dispose();
  }

  /// Reconstroi a cada tecla (pro botao "Buscar" habilitar/desabilitar
  /// junto com o formato da placa). Se ja havia um resultado (found /
  /// notFound / error), ele fica obsoleto ao editar — volta pra Idle pra
  /// nao mostrar o resumo de outro veiculo.
  void _onPlateEdited() {
    final hasStaleResult =
        _plateLookupStatus != _PlateLookupStatus.idle && _plateLookupStatus != _PlateLookupStatus.loading;
    setState(() {
      if (hasStaleResult) {
        _plateLookupStatus = _PlateLookupStatus.idle;
        _plateLookupResult = null;
        _manualOverride = false;
      }
    });
  }

  Future<void> _searchPlate() async {
    final plate = _plateController.text.trim().toUpperCase();
    if (!isValidPlateFormat(plate)) return;

    setState(() {
      _plateLookupStatus = _PlateLookupStatus.loading;
      _plateLookupErrorMessage = null;
    });

    try {
      final result = await ref.read(vehiclesRepositoryProvider).lookupPlate(plate);
      if (!mounted) return;
      if (result == null) {
        setState(() => _plateLookupStatus = _PlateLookupStatus.notFound);
        return;
      }
      setState(() {
        _plateLookupStatus = _PlateLookupStatus.found;
        _plateLookupResult = result;
        _manualOverride = false;
        _brandController.text = result.brand;
        _modelController.text = result.model;
        if (result.color != null) _colorController.text = result.color!;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _plateLookupStatus = _PlateLookupStatus.error;
        _plateLookupErrorMessage = error.toString();
      });
    }
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final renavam = _renavamController.text.trim();
      await ref.read(vehiclesRepositoryProvider).create(
            type: _type,
            brand: _brandController.text.trim(),
            model: _modelController.text.trim(),
            color: _colorController.text.trim(),
            plate: _plateController.text.trim().toUpperCase(),
            catalogYearId: _catalogYearId,
            size: _size,
            renavam: renavam.isEmpty ? null : renavam,
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
                  const SizedBox(height: 16),
                  Text(
                    'Digite a placa e buscamos os dados do veículo automaticamente.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                  ),
                  const SizedBox(height: 8),
                  PlateInputField(
                    controller: _plateController,
                    canSearch: isValidPlateFormat(_plateController.text.trim()),
                    loading: _plateLookupStatus == _PlateLookupStatus.loading,
                    onSearch: _searchPlate,
                  ),
                  if (_plateLookupStatus == _PlateLookupStatus.found && _plateLookupResult != null) ...[
                    const SizedBox(height: 10),
                    VehicleLookupSummaryCard(
                      result: _plateLookupResult!,
                      onEditManually: () => setState(() => _manualOverride = true),
                    ),
                  ] else if (_plateLookupStatus == _PlateLookupStatus.notFound) ...[
                    const SizedBox(height: 10),
                    const PlateNotFoundHint(),
                  ] else if (_plateLookupStatus == _PlateLookupStatus.error) ...[
                    const SizedBox(height: 10),
                    PlateLookupErrorHint(
                      message: _plateLookupErrorMessage ?? 'Não foi possível consultar a placa.',
                      onRetry: _searchPlate,
                    ),
                  ],
                  if (_plateLookupStatus != _PlateLookupStatus.found || _manualOverride) ...[
                    const SizedBox(height: 16),
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
                  ],
                  if (_plateLookupStatus == _PlateLookupStatus.found) ...[
                    const SizedBox(height: 12),
                    RenavamField(controller: _renavamController),
                  ],
                  const SizedBox(height: 16),
                  DropdownButtonFormField<CarSize?>(
                    initialValue: _size,
                    dropdownColor: AppColors.surface,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Tamanho (opcional)',
                      helperText: 'Usado pra calcular o preço da Lavagem por Tamanho automaticamente',
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Não informar')),
                      ...CarSize.values.map((s) => DropdownMenuItem(value: s, child: Text(s.label))),
                    ],
                    onChanged: (value) => setState(() => _size = value),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Selecione no catálogo (opcional)',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  Text(
                    'Habilita comparação de compatibilidade na loja.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                  ),
                  const SizedBox(height: 8),
                  _CatalogSelector(
                    catalogBrandId: _catalogBrandId,
                    catalogModelId: _catalogModelId,
                    onBrandModelYearSelected: (brandId, modelId, yearId, brandName, modelName) {
                      setState(() {
                        _catalogBrandId = brandId;
                        _catalogModelId = modelId;
                        _catalogYearId = yearId;
                        if (brandName != null) _brandController.text = brandName;
                        if (modelName != null) _modelController.text = modelName;
                      });
                    },
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

/// Callback: (brandId, modelId, yearId, brandName?, modelName?). `null` nos
/// ids sinaliza reset (ex.: trocou a marca, entao modelo/ano voltam a nulo).
typedef _CatalogSelection = void Function(
  String? brandId,
  String? modelId,
  String? yearId,
  String? brandName,
  String? modelName,
);

/// 3 dropdowns em cascata (marca -> modelo -> ano) sobre o catalogo
/// estruturado. Puramente opcional: o formulario continua funcionando com
/// os campos de texto livre mesmo sem usar isto.
class _CatalogSelector extends ConsumerWidget {
  const _CatalogSelector({
    required this.catalogBrandId,
    required this.catalogModelId,
    required this.onBrandModelYearSelected,
  });

  final String? catalogBrandId;
  final String? catalogModelId;
  final _CatalogSelection onBrandModelYearSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brandsAsync = ref.watch(vehicleCatalogBrandsProvider);

    return Column(
      children: [
        brandsAsync.when(
          loading: () => const LinearProgressIndicator(color: AppColors.primary),
          error: (_, __) => const SizedBox.shrink(),
          data: (brands) => DropdownButtonFormField<String>(
            initialValue: catalogBrandId,
            isExpanded: true,
            dropdownColor: AppColors.surface,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: const InputDecoration(labelText: 'Marca (catálogo)'),
            hint: Text('Selecionar', style: TextStyle(color: AppColors.textMuted)),
            items: brands
                .map((b) => DropdownMenuItem(value: b.id, child: Text(b.name)))
                .toList(),
            onChanged: (brandId) {
              String? brandName;
              for (final b in brands) {
                if (b.id == brandId) brandName = b.name;
              }
              onBrandModelYearSelected(brandId, null, null, brandName, null);
            },
          ),
        ),
        const SizedBox(height: 10),
        if (catalogBrandId != null)
          Consumer(
            builder: (context, ref, _) {
              final modelsAsync = ref.watch(vehicleCatalogModelsProvider(catalogBrandId!));
              return modelsAsync.when(
                loading: () => const LinearProgressIndicator(color: AppColors.primary),
                error: (_, __) => const SizedBox.shrink(),
                data: (models) => DropdownButtonFormField<String>(
                  initialValue: catalogModelId,
                  isExpanded: true,
                  dropdownColor: AppColors.surface,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Modelo (catálogo)'),
                  hint: Text('Selecionar', style: TextStyle(color: AppColors.textMuted)),
                  items: models
                      .map((m) => DropdownMenuItem(value: m.id, child: Text(m.name)))
                      .toList(),
                  onChanged: (modelId) {
                    String? modelName;
                    for (final m in models) {
                      if (m.id == modelId) modelName = m.name;
                    }
                    onBrandModelYearSelected(catalogBrandId, modelId, null, null, modelName);
                  },
                ),
              );
            },
          ),
        if (catalogBrandId != null && catalogModelId != null) ...[
          const SizedBox(height: 10),
          Consumer(
            builder: (context, ref, _) {
              final yearsAsync = ref.watch(vehicleCatalogYearsProvider(catalogModelId!));
              return yearsAsync.when(
                loading: () => const LinearProgressIndicator(color: AppColors.primary),
                error: (_, __) => const SizedBox.shrink(),
                data: (years) => DropdownButtonFormField<String>(
                  isExpanded: true,
                  dropdownColor: AppColors.surface,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Ano (catálogo)'),
                  hint: Text('Selecionar', style: TextStyle(color: AppColors.textMuted)),
                  items: years
                      .map((y) => DropdownMenuItem(value: y.id, child: Text('${y.year}')))
                      .toList(),
                  onChanged: (yearId) {
                    onBrandModelYearSelected(catalogBrandId, catalogModelId, yearId, null, null);
                  },
                ),
              );
            },
          ),
        ],
      ],
    );
  }
}
