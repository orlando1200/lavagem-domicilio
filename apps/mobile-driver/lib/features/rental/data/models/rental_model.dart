double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Status do aluguel de moto, espelhando o enum `RentalStatus` do backend.
enum RentalStatus {
  requested,
  active,
  completed,
  cancelled,
  overdue;

  static RentalStatus fromBackend(String value) {
    return RentalStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => RentalStatus.requested,
    );
  }
}

extension RentalStatusX on RentalStatus {
  String get label {
    switch (this) {
      case RentalStatus.requested:
        return 'Aguardando aprovação';
      case RentalStatus.active:
        return 'Ativo';
      case RentalStatus.completed:
        return 'Concluído';
      case RentalStatus.cancelled:
        return 'Cancelado';
      case RentalStatus.overdue:
        return 'Em atraso';
    }
  }
}

/// Aluguel de moto do lavador (modulo `rental`). Nasce via autoservico
/// (`POST /rentals/me/request`) com `weeklyRate = 0` — o admin confirma
/// o valor real ao aprovar, entao 0 sempre significa "a definir",
/// nunca um preco de fato gratuito.
class RentalModel {
  const RentalModel({
    required this.id,
    required this.status,
    required this.weeklyRate,
    required this.createdAt,
    this.startedAt,
    this.endedAt,
  });

  final String id;
  final RentalStatus status;
  final double weeklyRate;
  final DateTime createdAt;
  final DateTime? startedAt;
  final DateTime? endedAt;

  bool get isPending => status == RentalStatus.requested;
  bool get hasDefinedRate => weeklyRate > 0;

  factory RentalModel.fromJson(Map<String, dynamic> json) {
    return RentalModel(
      id: json['id'] as String,
      status: RentalStatus.fromBackend(json['status'] as String),
      weeklyRate: _parseDouble(json['weeklyRate']),
      createdAt: DateTime.parse(json['createdAt'] as String),
      startedAt: json['startedAt'] != null
          ? DateTime.parse(json['startedAt'] as String)
          : null,
      endedAt: json['endedAt'] != null
          ? DateTime.parse(json['endedAt'] as String)
          : null,
    );
  }
}
