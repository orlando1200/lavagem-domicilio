/// Modelo de endereco do cliente, espelhando `POST/GET /addresses`.
class AddressModel {
  const AddressModel({
    required this.id,
    required this.street,
    required this.number,
    required this.neighborhood,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.isDefault,
    this.label,
    this.complement,
  });

  final String id;
  final String? label;
  final String street;
  final String number;
  final String? complement;
  final String neighborhood;
  final String city;
  final String state;
  final String zipCode;
  final bool isDefault;

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id'] as String,
      label: json['label'] as String?,
      street: json['street'] as String,
      number: json['number'] as String,
      complement: json['complement'] as String?,
      neighborhood: json['neighborhood'] as String,
      city: json['city'] as String,
      state: json['state'] as String,
      zipCode: json['zipCode'] as String,
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  String get displayLine => '$street, $number · $neighborhood, $city-$state';
}
