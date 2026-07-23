import 'package:flutter/material.dart';

/// Paleta oficial GIUCAR Cyberpunk.
///
/// REGRA: nenhuma outra cor (Colors.xxx ou hex solto) deve ser usada
/// no app. Toda cor precisa vir desta classe.
class AppColors {
  AppColors._();

  // ── Base ──────────────────────────────────────────────────────────────
  /// Fundo principal do app.
  static const Color background = Color(0xFF050811);

  /// Superficies / cards.
  static const Color surface = Color(0xFF0B1020);

  /// Variante de superficie (usada em chips, mini metrics, banners).
  static const Color surfaceAlt = Color(0xFF0B1020);

  /// Bordas padrao de cards e superficies neon.
  static const Color border = Color(0xFF1A2342);

  // ── Ciano ─────────────────────────────────────────────────────────────
  static const Color primary = Color(0xFF00F2C2);
  static const Color primaryAlt = Color(0xFF00F5D4);

  /// Tom escurecido do ciano (usado sobre fundos claros / texto de botao).
  static const Color primaryDark = Color(0xFF0B1020);

  /// Container translucido em torno do ciano.
  static Color get primaryContainer => primary.withValues(alpha: 0.16);

  // ── Roxo ──────────────────────────────────────────────────────────────
  static const Color accent = Color(0xFF9D4EDD);
  static const Color accentAlt = Color(0xFFC77DFF);

  /// Container translucido em torno do roxo.
  static Color get accentContainer => accent.withValues(alpha: 0.16);

  // ── Texto ─────────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFFFFFFF);
  static Color get textSecondary => textPrimary.withValues(alpha: 0.72);
  static Color get textMuted => textPrimary.withValues(alpha: 0.5);

  // ── Semanticas (derivadas da paleta, sem hex externo) ───────────────────
  /// Estados de erro usam o roxo-claro para permanecer dentro da paleta.
  static const Color error = accentAlt;

  /// Glow padrao usado em sombras neon (ciano).
  static Color get glow => primary.withValues(alpha: 0.35);

  /// Glow roxo usado em sombras neon alternativas.
  static Color get glowAccent => accent.withValues(alpha: 0.35);

  // ── Gradientes utilitarios ───────────────────────────────────────────────
  static const List<Color> primaryAccentGradient = [primary, accent];

  static RadialGradient backgroundRadialGradient({
    Alignment center = const Alignment(-0.7, -0.9),
  }) {
    return RadialGradient(
      center: center,
      radius: 1.2,
      colors: [
        primary.withValues(alpha: 0.22),
        background.withValues(alpha: 0.0),
      ],
      stops: const [0.0, 1.0],
    );
  }
}
