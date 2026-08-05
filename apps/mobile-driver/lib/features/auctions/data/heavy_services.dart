/// Rotulos dos servicos pesados do leilao — mesmo vocabulario de ids
/// usado pelo app cliente ao abrir o leilao
/// (apps/mobile-client/lib/features/auctions/data/heavy_services.dart).
const Map<String, String> _heavyServiceTitles = {
  'cristalizacao_pintura': 'Cristalização de Pintura',
  'polimento': 'Polimento',
  'descontaminacao_pintura': 'Descontaminação de Pintura',
  'lavagem_chassi': 'Lavagem de Chassi',
  'funilaria_pintura': 'Funilaria & Pintura',
  'tapecaria_bancos': 'Tapeçaria e Bancos',
};

String heavyServiceTitle(String id) => _heavyServiceTitles[id] ?? id;
