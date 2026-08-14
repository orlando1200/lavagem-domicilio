import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/auth_repository.dart';
import 'auth_state.dart';

/// Provider de autenticacao do lojista conectado ao backend real via
/// [AuthRepository] (POST /auth/login, POST /auth/register, POST /stores).
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repository) : super(const AuthState.initial()) {
    _restoreSession();
  }

  final AuthRepository _repository;

  Future<void> _restoreSession() async {
    try {
      final user = await _repository.fetchCurrentUser();
      if (user != null) {
        state = AuthState.authenticated(user);
      } else {
        state = const AuthState.unauthenticated();
      }
    } catch (_) {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> login(String email, String password) async {
    state = const AuthState.loading();
    try {
      final user = await _repository.login(email, password);
      state = AuthState.authenticated(user);
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }

  Future<void> register({
    required String storeName,
    required String email,
    required String password,
    required StoreType storeType,
    required LogisticsMode logisticsMode,
    String document = '00000000000',
  }) async {
    state = const AuthState.loading();
    try {
      final user = await _repository.register(
        storeName: storeName,
        email: email,
        password: password,
        document: document,
        storeType: storeType,
        logisticsMode: logisticsMode,
      );
      state = AuthState.authenticated(user);
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }

  void updatePlan({
    required StoreType storeType,
    required LogisticsMode logisticsMode,
  }) {
    final current = state;
    if (current is AuthAuthenticated) {
      state = AuthState.authenticated(
        current.user.copyWith(
          storeType: storeType,
          logisticsMode: logisticsMode,
        ),
      );
    }
  }

  /// Recarrega o perfil/loja atual do backend (usado apos editar o
  /// perfil em `/profile/edit`, pra refletir o nome novo na home sem
  /// exigir logout/login).
  Future<void> refreshProfile() async {
    try {
      final user = await _repository.fetchCurrentUser();
      if (user != null) {
        state = AuthState.authenticated(user);
      }
    } catch (_) {
      // Mantem o estado atual em caso de falha de rede.
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState.unauthenticated();
  }
}
