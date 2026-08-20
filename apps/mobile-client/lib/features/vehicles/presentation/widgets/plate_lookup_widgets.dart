import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/plate_lookup_model.dart';

/// Campo de placa (maiusculas) com botao de busca ao lado — so habilita
/// quando o formato ja e valido, pra nao disparar consulta com placa
/// incompleta.
class PlateInputField extends StatelessWidget {
  const PlateInputField({
    super.key,
    required this.controller,
    required this.canSearch,
    required this.loading,
    required this.onSearch,
  });

  final TextEditingController controller;
  final bool canSearch;
  final bool loading;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: TextFormField(
            controller: controller,
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(color: AppColors.textPrimary, letterSpacing: 1.2),
            decoration: const InputDecoration(labelText: 'Placa', hintText: 'ABC1D23'),
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe a placa' : null,
            onFieldSubmitted: (_) {
              if (canSearch && !loading) onSearch();
            },
          ),
        ),
        const SizedBox(width: 10),
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: FilledButton.tonal(
            onPressed: (canSearch && !loading) ? onSearch : null,
            child: loading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                  )
                : const Text('Buscar'),
          ),
        ),
      ],
    );
  }
}

/// Card somente-leitura com os dados retornados pela consulta de placa,
/// pro usuario confirmar antes de salvar (passo 3 do fluxo: autofill +
/// confirmacao). `onEditManually` reabre marca/modelo/cor pra edicao —
/// util quando a placa encontra um veiculo parecido mas nao identico.
class VehicleLookupSummaryCard extends StatelessWidget {
  const VehicleLookupSummaryCard({
    super.key,
    required this.result,
    required this.onEditManually,
  });

  final PlateLookupResult result;
  final VoidCallback onEditManually;

  @override
  Widget build(BuildContext context) {
    final year = result.yearLabel;
    final details = [result.color, result.fuelType].whereType<String>().join(' · ');

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primaryContainer,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.check_circle, color: AppColors.primary, size: 18),
              SizedBox(width: 6),
              Text(
                'Veículo encontrado',
                style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${result.brand} ${result.model}${year != null ? ' · $year' : ''}',
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
          ),
          if (details.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(details, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ],
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: onEditManually,
              style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
              child: Text(
                'Não é seu veículo? Editar manualmente',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12, decoration: TextDecoration.underline),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Aviso inline pro estado "NotFound" (placa nao encontrada na base
/// consultada) — nao bloqueia nada, so avisa que o cadastro segue manual.
class PlateNotFoundHint extends StatelessWidget {
  const PlateNotFoundHint({super.key});

  @override
  Widget build(BuildContext context) {
    return const _InlineHint(
      icon: Icons.info_outline,
      color: AppColors.accentAlt,
      text: 'Placa não encontrada na base consultada. Preencha os dados manualmente abaixo.',
    );
  }
}

/// Aviso inline pro estado "Error" (falha de rede/servidor na consulta,
/// diferente de placa-nao-encontrada) — com botao de tentar de novo.
class PlateLookupErrorHint extends StatelessWidget {
  const PlateLookupErrorHint({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: _InlineHint(icon: Icons.error_outline, color: AppColors.error, text: message)),
        TextButton(onPressed: onRetry, child: const Text('Tentar de novo')),
      ],
    );
  }
}

class _InlineHint extends StatelessWidget {
  const _InlineHint({required this.icon, required this.color, required this.text});

  final IconData icon;
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 6),
        Expanded(child: Text(text, style: TextStyle(color: color, fontSize: 12))),
      ],
    );
  }
}

/// Campo de RENAVAM — so aparece depois que a placa e confirmada (passo 4
/// do fluxo). Numerico, 11 digitos, opcional (backend nao exige).
class RenavamField extends StatelessWidget {
  const RenavamField({super.key, required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      maxLength: 11,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: const InputDecoration(
        labelText: 'RENAVAM (opcional)',
        counterText: '',
        helperText: '11 dígitos, sem pontos ou traços',
      ),
      validator: (v) {
        if (v == null || v.trim().isEmpty) return null;
        if (v.trim().length != 11) return 'RENAVAM deve ter 11 dígitos';
        return null;
      },
    );
  }
}
