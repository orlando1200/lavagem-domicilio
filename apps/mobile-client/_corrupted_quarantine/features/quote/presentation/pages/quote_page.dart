import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/loading_skeleton.dart';
import '../../../addresses/presentation/providers/addresses_provider.dart';
import '../../../catalog/presentation/providers/catalog_provider.dart';
import '../../../vehicles/presentation/providers/vehicles_provider.dart';


























































































































































































































































































































































































































                              ),
                        ),
                      ],
                      if (quote.recurrencePreview != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          'Plano recorrente',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: colorScheme.onPrimaryContainer,
                              ),
                        ),
                        const SizedBox(height: 8),
                        _QuoteLine(
                          label: 'Frequência',
                          value: _frequencyLabel(quote.recurrencePreview!.frequency),
                        ),
                        _QuoteLine(
                          label: 'Ocorrências',
                          value: '${quote.recurrencePreview!.occurrences}',
                        ),
                        _QuoteLine(
                          label: 'Desconto recorrente',
                          value: '${quote.recurrencePreview!.discountPercentage.toStringAsFixed(0)}%',
                          valueColor: Colors.green,
                        ),
                        _QuoteLine(
                          label: 'Valor por visita',
                          value: 'R\$ ${quote.recurrencePreview!.discountedUnitPrice.toStringAsFixed(2)}',
                        ),
                        _QuoteLine(
                          label: 'Total projetado',
                          value: 'R\$ ${quote.recurrencePreview!.projectedTotal.toStringAsFixed(2)}',
                          isBold: true,
                        ),
                      ],
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: () => context.push('/quote-checkout'),
                        icon: const Icon(Icons.payment),
                        label: const Text('Continuar para pagamento'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
