import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/token_storage.dart';
import '../../../notifications/data/notifications_repository.dart';
import '../../data/driver_auth_repository.dart';
import 'driver_auth_state.dart';

/// Provider de autenticacao do lavador conectado ao backend real via
/// [DriverAuthRepository].
final driverAuthProvider =
    StateNotifierProvider<DriverAuthNotifier, DriverAuthState>((ref) {
  return DriverAuthNotifier(
    ref.watch(driverAuthRepositoryProvider),
    ref.watch(notificationsRepositoryProvider),
    ref.watch(tokenStorageProvider),
  );
});

class DriverAuthNotifier extends StateNotifier<DriverAuthState> {
  DriverAuthNotifier(this._repository, this._notificationsRepository, this._tokenStorage)
      : super(const DriverAuthState.initial()) {
    _restoreSession();
  }

  final DriverAuthRepository _repository;
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
        state = DriverAuthState.authenticated(user);
        unawaited(_registerPushTokenBestEffort());
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
      unawaited(_registerPushTokenBestEffort());
    } catch (e) {
      state = DriverAuthState.error(e.toString());
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = const DriverAuthState.loading();
    try {
      final user = await _repository.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );
      state = DriverAuthState.authenticated(user);
      unawaited(_registerPushTokenBestEffort());
    } catch (e) {
      state = DriverAuthState.error(e.toString());
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
    state = const DriverAuthState.unauthenticated();
  }
}
