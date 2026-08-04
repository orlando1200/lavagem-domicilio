import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Tela generica "em breve" para rotas fora do escopo desta fase de
/// integracao com o backend (ex.: marketplace, aluguel de motos,
/// veiculos, enderecos, engajamento completo).
class PlaceholderPage extends StatelessWidget {
  const PlaceholderPage({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Em breve',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ),
    );
  }
}
