import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../auctions/auctions_provider.dart';
import '../../../auctions/data/driver_profile_repository.dart';
import '../../../auctions/data/models/driver_profile_model.dart';
import '../../data/zones_repository.dart';

/// Tela de "Área de atuação": zona de cobertura (PATCH
/// /driver-profiles/me { currentZoneId }) + raio de atendimento em km
/// ({ serviceRadiusKm }) — ambos ja existiam no backend, so nunca
/// tinham tela pra edição real.
class ServiceAreaPage extends ConsumerStatefulWidget {
  const ServiceAreaPage({super.key});

  @override
  ConsumerState<ServiceAreaPage> createState() => _ServiceAreaPageState();
}

class _ServiceAreaPageState extends ConsumerState<ServiceAreaPage> {
  String? _selectedZoneId;
  double _radiusKm = 5;
  bool _initialized = false;
  bool _submitting = false;
  String? _errorMessage;

  void _initializeFrom(DriverProfileModel? profile) {
    if (_initialized || profile == null) return;
    _selectedZoneId = profile.zone?.id;
    _radiusKm = profile.serviceRadiusKm;
    _initialized = true;
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _errorMessage = null;
    });
    try {
      await ref.read(driverProfileRepositoryProvider).updateArea(
            currentZoneId: _selectedZoneId,
            serviceRadiusKm: _radiusKm,
          );
      ref.invalidate(myDriverProfileProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Área de atuação atualizada!')),
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
    final profileAsync = ref.watch(myDriverProfileProvider);
    final zonesAsync = ref.watch(_activeZonesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Área de atuação')),
      body: SafeArea(
        child: profileAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          error: (error, stackTrace) => Center(
            child: Text(error.toString(),
                style: const TextStyle(color: AppColors.error)),
          ),
          data: (profile) {
            _initializeFrom(profile);
            return zonesAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
              error: (error, stackTrace) => Center(
                child: Text(error.toString(),
                    style: const TextStyle(color: AppColors.error)),
              ),
              data: (zones) => SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: NeonSurface(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Zona de cobertura',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Define em qual região você recebe pedidos.',
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedZoneId,
                        dropdownColor: AppColors.surface,
                        decoration: const InputDecoration(labelText: 'Zona'),
                        items: zones
                            .map(
                              (zone) => DropdownMenuItem(
                                value: zone.id,
                                child: Text(
                                    '${zone.name} — ${zone.city}/${zone.state}'),
                              ),
                            )
                            .toList(),
                        onChanged: (value) =>
                            setState(() => _selectedZoneId = value),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Raio de atendimento: ${_radiusKm.toStringAsFixed(0)} km',
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w800),
                      ),
                      Slider(
                        value: _radiusKm.clamp(1, 50),
                        min: 1,
                        max: 50,
                        divisions: 49,
                        activeColor: AppColors.primary,
                        label: '${_radiusKm.toStringAsFixed(0)} km',
                        onChanged: (value) => setState(() => _radiusKm = value),
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: AppColors.error),
                          textAlign: TextAlign.center,
                        ),
                      ],
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _submitting || _selectedZoneId == null
                            ? null
                            : _submit,
                        child: _submitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.primaryDark),
                              )
                            : const Text('Salvar'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

final _activeZonesProvider =
    FutureProvider.autoDispose<List<ZoneSummary>>((ref) {
  return ref.watch(zonesRepositoryProvider).fetchActiveZones();
});
