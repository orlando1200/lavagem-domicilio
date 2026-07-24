import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/driver_auth_repository.dart';
import 'driver_auth_state.dart';

/// Provider de autenticacao do lavador conectado ao backend real via
/// [DriverAuthRepository].
final driverAuthProvider =
    StateNotifierProvider<DriverAuthNotifier, DriverAuthState>((ref) {
  return DriverAuthNotifier(ref.watch(driverAuthRepositoryProvider));
});

class DriverAuthNotifier extends StateNotifier<DriverAuthState> {
  DriverAuthNotifier(this._repository) : super(const DriverAuthState.initial()) {
    _restoreSession();
  }

  final DriverAuthRepository _repository;

  Future<void> _restoreSession() async {
    try {
      final user = await _repository.fetchCurrentUser();
      if (user != null) {
        state = DriverAuthState.authenticated(user);
      } else {
        state = const DriverAuthState.unauthenticated();
      }
    } catch (_) {
      state = const DriverAuthState.unauthenticated();
    }
  }

  Future<void> login(String email, String password) async {
    state = const DriverAuthState.loading();
    try {
      final user = await _repository.login(email, password);
      state = DriverAuthState.authenticated(user);
    } catch (e) {
      state = DriverAuthState.error(e.toString());
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const DriverAuthState.unauthenticated();
  }
}
