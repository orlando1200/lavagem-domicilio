/// Catalogo fixo de servicos pesados oferecidos no leilao (nao ha modulo
/// de catalogo de servicos integrado no backend — `services-catalog`
/// esta corrompido/fora do build, ver docs/FASE9_CORRUPTED_MODULES.md).
/// Lista espelha exatamente o mockup de produto em
/// apps/preview/preview_client.html (#leilao).
class HeavyService {
  const HeavyService(this.id, this.title, this.description, this.emoji);

  final String id;
  final String title;
  final String description;
  final String emoji;
}

const List<HeavyService> heavyServices = [
  HeavyService(
    'cristalizacao_pintura',
    'Cristalização de Pintura',
    'Proteção e brilho duradouro.',
    '✨',
  ),
  HeavyService(
    'polimento',
    'Polimento',
    'Correção de riscos e marcas superficiais.',
    '🪞',
  ),
  HeavyService(
    'descontaminacao_pintura',
    'Descontaminação de Pintura',
    'Remoção de resíduos industriais e ferro de freio.',
    '🧼',
  ),
  HeavyService(
    'lavagem_chassi',
    'Lavagem de Chassi',
    'Limpeza completa e proteção da parte inferior.',
    '🚿',
  ),
  HeavyService(
    'funilaria_pintura',
    'Funilaria & Pintura',
    'Martelinho de ouro, pequenos retoques e pintura localizada.',
    '🔨',
  ),
  HeavyService(
    'tapecaria_bancos',
    'Tapeçaria e Bancos',
    'Capas de couro sob medida e revestimento completo dos bancos.',
    '🛋️',
  ),
];

String heavyServiceTitle(String id) {
  for (final service in heavyServices) {
    if (service.id == id) return service.title;
  }
  return id;
}
