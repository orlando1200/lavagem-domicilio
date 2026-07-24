/// Modelo simples de lavador (motorista/prestador) autenticado,
/// espelhando o retorno sanitizado do backend (POST /auth/login,
/// GET /users/me). `rating`/`reviewsCount` ainda nao existem no backend
/// (nao ha endpoint de metricas do lavador) e permanecem com valores
/// default ate esse endpoint existir.
class DriverUser {
  const DriverUser({
    required this.id,
    required this.name,
    required this.email,
    this.rating = 0,
    this.reviewsCount = 0,
  });

  final String id;
  final String name;
  final String email;
  final double rating;
  final int reviewsCount;

  factory DriverUser.fromJson(Map<String, dynamic> json) {
    return DriverUser(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
    );
  }
}

/// Estado de autenticacao do app do lavador (padrao selado simples, sem
/// codegen), espelhando o `AuthState` do app cliente.
sealed class DriverAuthState {
  const DriverAuthState();

  const factory DriverAuthState.initial() = DriverAuthInitial;
  const factory DriverAuthState.loading() = DriverAuthLoading;
  const factory DriverAuthState.authenticated(DriverUser user) =
      DriverAuthAuthenticated;
  const factory DriverAuthState.unauthenticated() = DriverAuthUnauthenticated;
  const factory DriverAuthState.error(String message) = DriverAuthError;

  T when<T>({
    required T Function() initial,
    required T Function() loading,
    required T Function(DriverUser user) authenticated,
    required T Function() unauthenticated,
    required T Function(String message) error,
  }) {
    final state = this;
    if (state is DriverAuthInitial) return initial();
    if (state is DriverAuthLoading) return loading();
    if (state is DriverAuthAuthenticated) return authenticated(state.user);
    if (state is DriverAuthUnauthenticated) return unauthenticated();
    if (state is DriverAuthError) return error(state.message);
    throw StateError('Unhandled DriverAuthState: $state');
  }

  T maybeWhen<T>({
    T Function(DriverUser user)? authenticated,
    required T Function() orElse,
  }) {
    final state = this;
    if (state is DriverAuthAuthenticated && authenticated != null) {
      return authenticated(state.user);
    }
    return orElse();
  }
}

class DriverAuthInitial extends DriverAuthState {
  const DriverAuthInitial();
}

class DriverAuthLoading extends DriverAuthState {
  const DriverAuthLoading();
}

class DriverAuthAuthenticated extends DriverAuthState {
  const DriverAuthAuthenticated(this.user);
  final DriverUser user;
}

class DriverAuthUnauthenticated extends DriverAuthState {
  const DriverAuthUnauthenticated();
}

class DriverAuthError extends DriverAuthState {
  const DriverAuthError(this.message);
  final String message;
}
