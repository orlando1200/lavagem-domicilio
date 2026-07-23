import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_state.dart';

/// Provider de autenticacao (mock local, sem backend real).
///
/// Serve para manter a home/perfil funcionais mantendo a estrutura
/// esperada pelo restante do app (`authProvider`, `AuthState`).
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState.authenticated(
          AppUser(id: '1', name: 'Cliente GIUCAR', email: 'cliente@giucar.com'),
        ));

  Future<void> login(String email, String password) async {
    state = const AuthState.loading();
    await Future<void>.delayed(const Duration(milliseconds: 600));
    state = AuthState.authenticated(
      AppUser(id: '1', name: 'Cliente GIUCAR', email: email),
    );
  }

  Future<void> logout() async {
    state = const AuthState.unauthenticated();
  }
}
