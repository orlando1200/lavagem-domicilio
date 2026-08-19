/// Decimal do Prisma serializa como string no JSON (ex.: "549.90"), nao
/// como numero — parse defensivo que aceita os dois formatos.
double _parseDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}

List<String> _parseStringList(dynamic value) {
  if (value is! List) return const [];
  return value.map((e) => e.toString()).toList();
}

/// Leilao aberto disponivel para a loja pujar (GET /auctions/available),
/// ja filtrado pelo backend pela zona da loja.
class AvailableAuctionModel {
  const AvailableAuctionModel({
    required this.id,
    required this.serviceIds,
    required this.createdAt,
    required this.bidsCount,
    required this.photos,
    this.description,
    this.maxBudget,
    this.deadlineHours,
    this.orderTotalAmount,
  });

  final String id;
  final List<String> serviceIds;
  final DateTime createdAt;
  final int bidsCount;
  final List<String> photos;
  final String? description;
  final double? maxBudget;
  final int? deadlineHours;
  final double? orderTotalAmount;

  /// Prazo limite calculado (createdAt + deadlineHours), null se nao houver.
  DateTime? get deadline =>
      deadlineHours != null ? createdAt.add(Duration(hours: deadlineHours!)) : null;

  factory AvailableAuctionModel.fromJson(Map<String, dynamic> json) {
    final order = json['order'] as Map<String, dynamic>?;
    final count = json['_count'] as Map<String, dynamic>?;

    return AvailableAuctionModel(
      id: json['id'] as String,
      serviceIds: _parseStringList(json['serviceIds']),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      bidsCount: (count?['bids'] as num?)?.toInt() ?? 0,
      photos: _parseStringList(json['photos']),
      description: json['description'] as String?,
      maxBudget: json['maxBudget'] != null ? _parseDouble(json['maxBudget']) : null,
      deadlineHours: (json['deadlineHours'] as num?)?.toInt(),
      orderTotalAmount: order?['totalAmount'] != null ? _parseDouble(order!['totalAmount']) : null,
    );
  }
}

/// Puja enviada pela propria loja (GET /auctions/bids/me).
class MyBidModel {
  const MyBidModel({
    required this.id,
    required this.auctionId,
    required this.amount,
    required this.durationHours,
    required this.warrantyDays,
    required this.status,
    required this.createdAt,
    required this.auctionServiceIds,
    required this.auctionStatus,
  });

  final String id;
  final String auctionId;
  final double amount;
  final int durationHours;
  final int warrantyDays;
  final String status;
  final DateTime createdAt;
  final List<String> auctionServiceIds;
  final String auctionStatus;

  factory MyBidModel.fromJson(Map<String, dynamic> json) {
    final auction = json['auction'] as Map<String, dynamic>?;

    return MyBidModel(
      id: json['id'] as String,
      auctionId: json['auctionId'] as String,
      amount: _parseDouble(json['amount']),
      durationHours: (json['durationHours'] as num?)?.toInt() ?? 0,
      warrantyDays: (json['warrantyDays'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'pending',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      auctionServiceIds: _parseStringList(auction?['serviceIds']),
      auctionStatus: auction?['status'] as String? ?? 'open',
    );
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Aguardando decisão do cliente';
      case 'accepted':
        return 'Aceita ✓';
      case 'rejected':
        return 'Não selecionada';
      default:
        return status;
    }
  }
}
