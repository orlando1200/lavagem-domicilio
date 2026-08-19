import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/token_storage.dart';
import '../../../notifications/data/notifications_repository.dart';
import '../../data/auth_repository.dart';
import 'auth_state.dart';

/// Provider de autenticacao conectado ao backend real via [AuthRepository].
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authRepositoryProvider),
    ref.watch(notificationsRepositoryProvider),
    ref.watch(tokenStorageProvider),
  );
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repository, this._notificationsRepository, this._tokenStorage)
      : super(const AuthState.initial()) {
    _restoreSession();
  }

  final AuthRepository _repository;
  final NotificationsRepository _notificationsRepository;
  final TokenStorage _tokenStorage;

  /// Registra o dispositivo atual pra push (modo simulado) apos
  /// login/registro — best-effort, nunca deve travar o fluxo de auth.
  Future<void> _registerPushTokenBestEffort() async {
    try {
      final deviceId = await _tokenStorage.readOrCreateDeviceId();
      await _notificationsRepository.registerPushToken(deviceId);
    } catch (_) {
      // Falha de rede aqui nao deve impedir o login.
    }
  }

  Future<void> _restoreSession() async {
    try {
      final user = await _repository.fetchCurrentUser();
      if (user != null) {
        state = AuthState.authenticated(user);
        unawaited(_registerPushTokenBestEffort());
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
      unawaited(_registerPushTokenBestEffort());
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = const AuthState.loading();
    try {
      final user = await _repository.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );
      state = AuthState.authenticated(user);
      unawaited(_registerPushTokenBestEffort());
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }

  Future<void> logout() async {
    try {
      final deviceId = await _tokenStorage.readOrCreateDeviceId();
      await _notificationsRepository.unregisterPushToken(deviceId);
    } catch (_) {
      // Best-effort: nunca deve impedir o logout.
    }
    await _repository.logout();
    state = const AuthState.unauthenticated();
  }

  /// Recarrega os dados do usuario logado (ex.: apos editar o perfil).
  Future<void> refreshProfile() async {
    try {
      final user = await _repository.fetchCurrentUser();
      if (user != null) {
        state = AuthState.authenticated(user);
      }
    } catch (_) {
      // mantem o estado atual em caso de falha
    }
  }
}
