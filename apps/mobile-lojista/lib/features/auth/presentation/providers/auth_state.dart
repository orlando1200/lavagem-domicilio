import '../../../../core/constants/app_constants.dart';

/// Modelo simples de lojista autenticado.
class StoreUser {
  const StoreUser({
    required this.id,
    required this.storeName,
    required this.email,
    required this.storeType,
    required this.logisticsMode,
    this.storeId,
  });

  final String id;
  final String storeName;
  final String email;
  final StoreType storeType;
  final LogisticsMode logisticsMode;

  /// Id da Store no backend (POST /stores), usado nas chamadas de
  /// produtos (GET/POST /stores/:id/products). Nulo enquanto a loja
  /// ainda nao foi criada no backend real.
  final String? storeId;

  StoreUser copyWith({
    StoreType? storeType,
    LogisticsMode? logisticsMode,
    String? storeId,
  }) {
    return StoreUser(
      id: id,
      storeName: storeName,
      email: email,
      storeType: storeType ?? this.storeType,
      logisticsMode: logisticsMode ?? this.logisticsMode,
      storeId: storeId ?? this.storeId,
    );
  }
}

/// Estado de autenticacao do app do lojista (padrao selado simples, sem
/// codegen).
sealed class AuthState {
  const AuthState();

  const factory AuthState.initial() = AuthInitial;
  const factory AuthState.loading() = AuthLoading;
  const factory AuthState.authenticated(StoreUser user) = AuthAuthenticated;
  const factory AuthState.unauthenticated() = AuthUnauthenticated;
  const factory AuthState.error(String message) = AuthError;

  T when<T>({
    required T Function() initial,
    required T Function() loading,
    required T Function(StoreUser user) authenticated,
    required T Function() unauthenticated,
    required T Function(String message) error,
  }) {
    final state = this;
    if (state is AuthInitial) return initial();
    if (state is AuthLoading) return loading();
    if (state is AuthAuthenticated) return authenticated(state.user);
    if (state is AuthUnauthenticated) return unauthenticated();
    if (state is AuthError) return error(state.message);
    throw StateError('Unhandled AuthState: $state');
  }

  T maybeWhen<T>({
    T Function(StoreUser user)? authenticated,
    required T Function() orElse,
  }) {
    final state = this;
    if (state is AuthAuthenticated && authenticated != null) {
      return authenticated(state.user);
    }
    return orElse();
  }
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final StoreUser user;
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  const AuthError(this.message);
  final String message;
}
