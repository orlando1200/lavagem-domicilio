import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Texto de contagem regressiva ao vivo ate `deadline`, atualizado a cada
/// minuto. Mostra "Expirado" apos o prazo vencer.
class CountdownChip extends StatefulWidget {
  const CountdownChip({super.key, required this.deadline});

  final DateTime deadline;

  @override
  State<CountdownChip> createState() => _CountdownChipState();
}

class _CountdownChipState extends State<CountdownChip> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.deadline.difference(DateTime.now());
    final expired = remaining.isNegative;

    final label = expired
        ? 'Prazo encerrado'
        : remaining.inHours >= 24
            ? 'Encerra em ${(remaining.inHours / 24).floor()}d ${remaining.inHours % 24}h'
            : remaining.inHours >= 1
                ? 'Encerra em ${remaining.inHours}h ${remaining.inMinutes % 60}min'
                : 'Encerra em ${remaining.inMinutes}min';

    final color = expired
        ? AppColors.textMuted
        : remaining.inHours < 3
            ? AppColors.error
            : AppColors.accent;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.timer_outlined, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
