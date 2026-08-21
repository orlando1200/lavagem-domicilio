/// Tipo de debito fiscal do veiculo (IPVA/multas/licenciamento — modo
/// simulado, ver FiscalDebtGateway no backend).
enum FiscalDebtType {
  IPVA,
  MULTA,
  LICENCIAMENTO;

  static FiscalDebtType fromBackend(String value) {
    for (final type in FiscalDebtType.values) {
      if (type.name == value) return type;
    }
    return FiscalDebtType.IPVA;
  }

  String get label {
    switch (this) {
      case FiscalDebtType.IPVA:
        return 'IPVA';
      case FiscalDebtType.MULTA:
        return 'Multa';
      case FiscalDebtType.LICENCIAMENTO:
        return 'Licenciamento';
    }
  }
}

/// Decimal do Prisma serializa como string no JSON — parse defensivo.
double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

/// Um debito consultado pra um veiculo (GET /vehicles/:id/fiscal-debts).
/// So consulta — `status` sempre vem `PENDING` hoje, o pagamento de
/// verdade (Fase 2) ainda nao existe.
class FiscalDebtEntry {
  const FiscalDebtEntry({
    required this.id,
    required this.type,
    required this.description,
    required this.amount,
    this.dueDate,
  });

  final String id;
  final FiscalDebtType type;
  final String description;
  final double amount;
  final DateTime? dueDate;

  factory FiscalDebtEntry.fromJson(Map<String, dynamic> json) {
    final dueDateRaw = json['dueDate'] as String?;
    return FiscalDebtEntry(
      id: json['id'] as String,
      type: FiscalDebtType.fromBackend(json['type'] as String),
      description: json['description'] as String,
      amount: _parseDouble(json['amount']),
      dueDate: dueDateRaw != null ? DateTime.tryParse(dueDateRaw) : null,
    );
  }

  bool get isOverdue => dueDate != null && dueDate!.isBefore(DateTime.now());
}
