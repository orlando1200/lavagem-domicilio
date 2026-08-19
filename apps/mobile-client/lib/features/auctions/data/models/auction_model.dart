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

/// Item de leilao (GET /auctions/me), espelhando o resumo retornado pelo
/// backend (modulo `auctions`, `AUCTION_SUMMARY_INCLUDE`).
class AuctionModel {
  const AuctionModel({
    required this.id,
    required this.status,
    required this.serviceIds,
    required this.createdAt,
    required this.bidsCount,
    required this.photos,
    this.description,
    this.maxBudget,
    this.deadlineHours,
    this.closedAt,
    this.orderTotalAmount,
  });

  final String id;
  final String status;
  final List<String> serviceIds;
  final DateTime createdAt;
  final int bidsCount;
  final List<String> photos;
  final String? description;
  final double? maxBudget;
  final int? deadlineHours;
  final DateTime? closedAt;
  final double? orderTotalAmount;

  /// Prazo limite calculado (createdAt + deadlineHours), null se nao houver.
  DateTime? get deadline =>
      deadlineHours != null ? createdAt.add(Duration(hours: deadlineHours!)) : null;

  factory AuctionModel.fromJson(Map<String, dynamic> json) {
    final order = json['order'] as Map<String, dynamic>?;
    final count = json['_count'] as Map<String, dynamic>?;

    return AuctionModel(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'open',
      serviceIds: _parseStringList(json['serviceIds']),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      bidsCount: (count?['bids'] as num?)?.toInt() ?? 0,
      photos: _parseStringList(json['photos']),
      description: json['description'] as String?,
      maxBudget: json['maxBudget'] != null ? _parseDouble(json['maxBudget']) : null,
      deadlineHours: (json['deadlineHours'] as num?)?.toInt(),
      closedAt: json['closedAt'] != null ? DateTime.tryParse(json['closedAt'] as String) : null,
      orderTotalAmount: order?['totalAmount'] != null ? _parseDouble(order!['totalAmount']) : null,
    );
  }

  /// Status do leilao (enum `AuctionStatus`: open, closed, cancelled, expired).
  String get statusLabel {
    switch (status) {
      case 'open':
        return 'Aberto · recebendo ofertas';
      case 'closed':
        return 'Fechado · oferta aceita';
      case 'cancelled':
        return 'Cancelado';
      case 'expired':
        return 'Expirado';
      default:
        return status;
    }
  }
}

/// Puja (AuctionBid) ja rankeada pelo backend, com dados da loja
/// (DriverProfile + User) achatados para exibicao.
class AuctionBidModel {
  const AuctionBidModel({
    required this.id,
    required this.amount,
    required this.durationHours,
    required this.warrantyDays,
    required this.status,
    required this.photos,
    required this.supplierName,
    this.message,
    this.supplierRating,
    this.rank,
    this.score,
  });

  final String id;
  final double amount;
  final int durationHours;
  final int warrantyDays;
  final String status;
  final List<String> photos;
  final String supplierName;
  final String? message;
  final double? supplierRating;
  final int? rank;
  final double? score;

  factory AuctionBidModel.fromJson(Map<String, dynamic> json) {
    final supplier = json['supplier'] as Map<String, dynamic>?;
    final user = supplier?['user'] as Map<String, dynamic>?;
    final rating = supplier?['averageRating'];

    return AuctionBidModel(
      id: json['id'] as String,
      amount: _parseDouble(json['amount']),
      durationHours: (json['durationHours'] as num?)?.toInt() ?? 0,
      warrantyDays: (json['warrantyDays'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'pending',
      photos: _parseStringList(json['photos']),
      supplierName: (user?['name'] as String?) ?? 'Loja parceira',
      message: json['message'] as String?,
      supplierRating: rating != null ? _parseDouble(rating) : null,
      rank: (json['rank'] as num?)?.toInt(),
      score: json['score'] != null ? _parseDouble(json['score']) : null,
    );
  }
}

/// Detalhe de um leilao (GET /auctions/me/:id), com as pujas ja
/// rankeadas pelo backend em ordem decrescente de score.
class AuctionDetailModel {
  const AuctionDetailModel({
    required this.id,
    required this.status,
    required this.serviceIds,
    required this.createdAt,
    required this.bids,
    required this.photos,
    this.description,
    this.maxBudget,
    this.deadlineHours,
    this.closedAt,
  });

  final String id;
  final String status;
  final List<String> serviceIds;
  final DateTime createdAt;
  final List<AuctionBidModel> bids;
  final List<String> photos;
  final String? description;
  final double? maxBudget;
  final int? deadlineHours;
  final DateTime? closedAt;

  bool get isOpen => status == 'open';

  /// Prazo limite calculado (createdAt + deadlineHours), null se nao houver.
  DateTime? get deadline =>
      deadlineHours != null ? createdAt.add(Duration(hours: deadlineHours!)) : null;

  factory AuctionDetailModel.fromJson(Map<String, dynamic> json) {
    final bidsJson = json['bids'] as List<dynamic>? ?? [];

    return AuctionDetailModel(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'open',
      serviceIds: _parseStringList(json['serviceIds']),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      bids: bidsJson.map((e) => AuctionBidModel.fromJson(e as Map<String, dynamic>)).toList(),
      photos: _parseStringList(json['photos']),
      description: json['description'] as String?,
      maxBudget: json['maxBudget'] != null ? _parseDouble(json['maxBudget']) : null,
      deadlineHours: (json['deadlineHours'] as num?)?.toInt(),
      closedAt: json['closedAt'] != null ? DateTime.tryParse(json['closedAt'] as String) : null,
    );
  }
}
