/// Constantes de configuracao da aplicacao (nao relacionadas a regras
/// comerciais de planos/taxas — ver [StorePlanRules] para isso).
class AppConstants {
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );
}

/// Tipo de loja do lojista GIUCAR.
///
/// - [lavador]: loja que vende para lavadores (produtos profissionais/
///   insumos). Tarifas mais altas por ter ticket medio maior.
/// - [cliente]: loja que vende para o cliente final (acessorios/produtos
///   de consumo). Tarifas reduzidas.
enum StoreType {
  lavador,
  cliente,
}

extension StoreTypeLabel on StoreType {
  String get label {
    switch (this) {
      case StoreType.lavador:
        return 'Loja LAVADOR';
      case StoreType.cliente:
        return 'Loja CLIENTE';
    }
  }

  String get description {
    switch (this) {
      case StoreType.lavador:
        return 'Vende produtos profissionais e insumos para lavadores.';
      case StoreType.cliente:
        return 'Vende acessorios e produtos para o cliente final.';
    }
  }

  /// Exemplos de produtos tipicos vendidos por este tipo de loja,
  /// usados como sugestao/placeholder nas telas de cadastro.
  String get examplesLabel {
    switch (this) {
      case StoreType.lavador:
        return 'Ex: shampoo automotivo, cera, aspirador profissional, panos de microfibra, equipamentos e repostos para lavagem.';
      case StoreType.cliente:
        return 'Ex: aromatizantes, capas de couro, cera carnauba, aspirador portatil, organizadores, lampadas, palhetas.';
    }
  }
}

/// Modalidade de logistica escolhida pelo lojista.
///
/// - [integrada]: a plataforma GIUCAR coleta e entrega o produto ao
///   comprador.
/// - [propria]: o proprio lojista (vendedor) entrega ou organiza a
///   retirada do produto.
enum LogisticsMode {
  integrada,
  propria,
}

extension LogisticsModeLabel on LogisticsMode {
  String get label {
    switch (this) {
      case LogisticsMode.integrada:
        return 'Logistica Integrada';
      case LogisticsMode.propria:
        return 'Logistica Propria';
    }
  }

  String get description {
    switch (this) {
      case LogisticsMode.integrada:
        return 'A plataforma GIUCAR coleta e entrega o produto ao comprador.';
      case LogisticsMode.propria:
        return 'Voce (vendedor) entrega diretamente ou organiza a retirada.';
    }
  }
}

/// Regras comerciais (mensalidade + comissao) para cada combinacao de
/// [LogisticsMode] x [StoreType].
///
/// REGRA: nenhum valor de tarifa deve ser escrito solto ("magic number")
/// nas telas — sempre consultar esta classe.
class StorePlanRules {
  StorePlanRules._();

  /// Mensalidade (R$) por modalidade de logistica + tipo de loja.
  static const Map<LogisticsMode, Map<StoreType, double>> monthlyFee = {
    LogisticsMode.integrada: {
      StoreType.lavador: 150.0,
      StoreType.cliente: 59.0,
    },
    LogisticsMode.propria: {
      StoreType.lavador: 110.0,
      StoreType.cliente: 29.0,
    },
  };

  /// Comissao (%) por modalidade de logistica + tipo de loja.
  static const Map<LogisticsMode, Map<StoreType, double>> commissionPercent = {
    LogisticsMode.integrada: {
      StoreType.lavador: 23.0,
      StoreType.cliente: 18.0,
    },
    LogisticsMode.propria: {
      StoreType.lavador: 15.0,
      StoreType.cliente: 12.0,
    },
  };

  static double monthlyFeeFor(LogisticsMode mode, StoreType type) {
    return monthlyFee[mode]![type]!;
  }

  static double commissionPercentFor(LogisticsMode mode, StoreType type) {
    return commissionPercent[mode]![type]!;
  }

  static String summaryFor(LogisticsMode mode, StoreType type) {
    final fee = monthlyFeeFor(mode, type);
    final commission = commissionPercentFor(mode, type);
    return 'R\$ ${fee.toStringAsFixed(0)}/mes + ${commission.toStringAsFixed(0)}%';
  }
}

/// Destino de catalogo escolhido ao cadastrar um produto.
enum CatalogTarget {
  lojaLavador,
  lojaCliente,
  ambas,
}

extension CatalogTargetLabel on CatalogTarget {
  String get label {
    switch (this) {
      case CatalogTarget.lojaLavador:
        return 'Loja do Lavador';
      case CatalogTarget.lojaCliente:
        return 'Loja do Cliente';
      case CatalogTarget.ambas:
        return 'Ambas as lojas';
    }
  }

  String get description {
    switch (this) {
      case CatalogTarget.lojaLavador:
        return 'Produtos profissionais e insumos para lavadores.';
      case CatalogTarget.lojaCliente:
        return 'Acessorios e souvenirs para o cliente final.';
      case CatalogTarget.ambas:
        return 'Produto aparece nos dois catalogos.';
    }
  }

  /// Exemplos de produtos tipicos para este destino de catalogo,
  /// usados como sugestao/placeholder no formulario de produto.
  String get examplesLabel {
    switch (this) {
      case CatalogTarget.lojaLavador:
        return 'Ex: shampoo automotivo, cera, aspirador profissional, panos de microfibra, equipamentos e repostos.';
      case CatalogTarget.lojaCliente:
        return 'Ex: aromatizantes, capas de couro, cera carnauba, aspirador portatil, organizadores, lampadas, palhetas.';
      case CatalogTarget.ambas:
        return 'Ex: produtos versateis, como aromatizantes premium ou kits de limpeza rapida.';
    }
  }
}

/// Status de aprovacao de um produto cadastrado pelo lojista.
enum ProductStatus {
  pendente,
  ativo,
  rejeitado,
}

extension ProductStatusLabel on ProductStatus {
  String get label {
    switch (this) {
      case ProductStatus.pendente:
        return 'Pendente';
      case ProductStatus.ativo:
        return 'Ativo';
      case ProductStatus.rejeitado:
        return 'Rejeitado';
    }
  }
}
