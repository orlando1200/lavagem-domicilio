/// Endereco de entrega informado no checkout — enviado como snapshot
/// JSON solto pro backend (`ProductOrder.shippingAddress`), sem
/// modulo de enderecos (decisao de escopo).
class ShippingAddress {
  const ShippingAddress({
    required this.street,
    required this.number,
    required this.neighborhood,
    required this.city,
    required this.state,
    required this.zipCode,
    this.complement,
  });

  final String street;
  final String number;
  final String? complement;
  final String neighborhood;
  final String city;
  final String state;
  final String zipCode;

  Map<String, dynamic> toJson() => {
        'street': street,
        'number': number,
        if (complement != null && complement!.isNotEmpty)
          'complement': complement,
        'neighborhood': neighborhood,
        'city': city,
        'state': state,
        'zipCode': zipCode,
      };
}
