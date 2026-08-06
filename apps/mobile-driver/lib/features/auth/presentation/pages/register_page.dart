import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../../auctions/data/driver_profile_repository.dart';
import '../providers/driver_auth_provider.dart';
import '../providers/driver_auth_state.dart';

/// Cadastro do lavador parceiro (App Lavador): dados da conta seguidos da
/// escolha de perfil de atuacao (Moto/Carro/Loja de Carwash).
///
/// `POST /auth/register` (role fixo `LAVADOR`) cria a conta; em seguida
/// `POST /driver-profiles/me` cria o `DriverProfile` com o `driverType`
/// escolhido — perfil sempre nasce `pending_documents` (aprovacao do
/// admin), mesmo comportamento de quem se cadastra direto pela API.
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;

  int _step = 0;
  String? _selectedType;
  bool _creatingProfile = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _goToProfileStep() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _step = 1);
  }

  Future<void> _submit() async {
    if (_selectedType == null) return;

    await ref.read(driverAuthProvider.notifier).register(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        );
    if (!mounted) return;

    final authState = ref.read(driverAuthProvider);
    if (authState is! DriverAuthAuthenticated) return;

    setState(() => _creatingProfile = true);
    try {
      await ref.read(driverProfileRepositoryProvider).createProfile(
            driverType: _selectedType!,
            allowedServices: _selectedType == 'CARWASH_SHOP' ? const ['HEAVY_SERVICE'] : null,
          );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Conta criada, mas houve um problema ao salvar seu perfil: $error'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _creatingProfile = false);
    }

    if (!mounted) return;
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(driverAuthProvider);
    final isLoading = authState is DriverAuthLoading || _creatingProfile;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () {
            if (_step == 1) {
              setState(() => _step = 0);
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Cadastro de parceiro',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w900,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  _step == 0 ? 'Passo 1 de 2 · Dados da conta' : 'Passo 2 de 2 · Escolha seu perfil',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                if (_step == 0)
                  _AccountStep(
                    formKey: _formKey,
                    nameController: _nameController,
                    emailController: _emailController,
                    phoneController: _phoneController,
                    passwordController: _passwordController,
                    confirmPasswordController: _confirmPasswordController,
                    obscurePassword: _obscurePassword,
                    onToggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
                    onContinue: _goToProfileStep,
                  )
                else
                  _ProfileStep(
                    selectedType: _selectedType,
                    onSelect: (type) => setState(() => _selectedType = type),
                    isLoading: isLoading,
                    onSubmit: _submit,
                  ),
                if (authState is DriverAuthError) ...[
                  const SizedBox(height: 16),
                  Text(
                    authState.message,
                    style: const TextStyle(color: AppColors.error),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AccountStep extends StatelessWidget {
  const _AccountStep({
    required this.formKey,
    required this.nameController,
    required this.emailController,
    required this.phoneController,
    required this.passwordController,
    required this.confirmPasswordController,
    required this.obscurePassword,
    required this.onToggleObscure,
    required this.onContinue,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController phoneController;
  final TextEditingController passwordController;
  final TextEditingController confirmPasswordController;
  final bool obscurePassword;
  final VoidCallback onToggleObscure;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: nameController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Nome completo',
                prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.primary),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) return 'Informe seu nome';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                labelText: 'E-mail',
                prefixIcon: Icon(Icons.mail_outline_rounded, color: AppColors.primary),
              ),
              validator: (value) {
                if (value == null || !value.contains('@')) return 'Informe um e-mail valido';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Telefone (opcional)',
                prefixIcon: Icon(Icons.phone_outlined, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: passwordController,
              obscureText: obscurePassword,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Senha',
                prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.primary),
                suffixIcon: IconButton(
                  icon: Icon(
                    obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: AppColors.textMuted,
                  ),
                  onPressed: onToggleObscure,
                ),
              ),
              validator: (value) {
                if (value == null || value.length < 8) return 'Minimo de 8 caracteres';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: confirmPasswordController,
              obscureText: obscurePassword,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Confirmar senha',
                prefixIcon: Icon(Icons.lock_outline_rounded, color: AppColors.primary),
              ),
              validator: (value) {
                if (value != passwordController.text) return 'As senhas nao coincidem';
                return null;
              },
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onContinue,
              child: const Text('Continuar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileStep extends StatelessWidget {
  const _ProfileStep({
    required this.selectedType,
    required this.onSelect,
    required this.isLoading,
    required this.onSubmit,
  });

  final String? selectedType;
  final ValueChanged<String> onSelect;
  final bool isLoading;
  final VoidCallback onSubmit;

  static const _options = [
    (
      type: 'MOTO_WASHER',
      icon: Icons.two_wheeler_rounded,
      title: 'Moto',
      description: 'Lavagens rápidas a seco e express em motos e carros pequenos.',
    ),
    (
      type: 'CAR_WASHER',
      icon: Icons.directions_car_rounded,
      title: 'Carro',
      description: 'Lavagens completas em carros, picapes e utilitários no local do cliente.',
    ),
    (
      type: 'CARWASH_SHOP',
      icon: Icons.storefront_rounded,
      title: 'Loja de Carwash',
      description:
          'Participe de leilões de serviços pesados (polimento, funilaria, tapeçaria) enviando ofertas.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final option in _options) ...[
          _ProfileTypeCard(
            icon: option.icon,
            title: option.title,
            description: option.description,
            selected: selectedType == option.type,
            onTap: () => onSelect(option.type),
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 8),
        FilledButton(
          onPressed: (selectedType == null || isLoading) ? null : onSubmit,
          child: isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryDark),
                )
              : const Text('Criar conta'),
        ),
      ],
    );
  }
}

class _ProfileTypeCard extends StatelessWidget {
  const _ProfileTypeCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      borderColor: selected ? AppColors.primary : null,
      glowColor: selected ? AppColors.glow : null,
      padding: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected ? AppColors.primaryContainer : AppColors.surfaceAlt,
                ),
                child: Icon(icon, color: selected ? AppColors.primary : AppColors.textMuted),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                    ),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                color: selected ? AppColors.primary : AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
