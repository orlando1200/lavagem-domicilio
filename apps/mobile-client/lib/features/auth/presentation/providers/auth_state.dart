/// Modelo simples de usuario autenticado.
class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
  });

  final String id;
  final String name;
  final String email;
}

/// Estado de autenticacao do app (padrao selado simples, sem codegen).
sealed class AuthState {
  const AuthState();

  const factory AuthState.initial() = AuthInitial;
  const factory AuthState.loading() = AuthLoading;
  const factory AuthState.authenticated(AppUser user) = AuthAuthenticated;
  const factory AuthState.unauthenticated() = AuthUnauthenticated;
  const factory AuthState.error(String message) = AuthError;

  T when<T>({
    required T Function() initial,
    required T Function() loading,
    required T Function(AppUser user) authenticated,
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
    T Function(AppUser user)? authenticated,
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
  final AppUser user;
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  const AuthError(this.message);
  final String message;
}
