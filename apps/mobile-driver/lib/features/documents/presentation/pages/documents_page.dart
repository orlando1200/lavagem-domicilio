import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/document_verification_model.dart';
import '../providers/document_verification_provider.dart';

const List<String> _docTypeOptions = ['cnh', 'crlv', 'foto_veiculo', 'comprovante_endereco'];

const Map<String, String> _docTypeLabels = {
  'cnh': 'CNH',
  'crlv': 'CRLV',
  'foto_veiculo': 'Foto do veículo',
  'comprovante_endereco': 'Comprovante de endereço',
};

/// Tela de "Perfil de atuação": envio e acompanhamento dos documentos do
/// lavador (CNH, CRLV, foto do veiculo, etc), com upload binario real
/// (modo simulado — salvo em disco local no backend, ver
/// `storage/local-disk.adapter.ts`).
class DocumentsPage extends ConsumerStatefulWidget {
  const DocumentsPage({super.key});

  @override
  ConsumerState<DocumentsPage> createState() => _DocumentsPageState();
}

class _DocumentsPageState extends ConsumerState<DocumentsPage> {
  String _docType = _docTypeOptions.first;
  XFile? _pickedFile;
  Uint8List? _pickedBytes;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(documentVerificationProvider.notifier).loadMine());
  }

  Future<void> _pickFile() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() {
      _pickedFile = file;
      _pickedBytes = bytes;
    });
  }

  Future<void> _submit() async {
    final file = _pickedFile;
    final bytes = _pickedBytes;
    if (file == null || bytes == null) return;

    final success = await ref.read(documentVerificationProvider.notifier).uploadFile(
          docType: _docType,
          bytes: bytes,
          fileName: file.name,
        );

    if (!mounted) return;
    if (success) {
      setState(() {
        _pickedFile = null;
        _pickedBytes = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Documento enviado para análise.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<DocumentVerificationState>(documentVerificationProvider, (previous, next) {
      if (next.errorMessage != null && next.errorMessage != previous?.errorMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.errorMessage!)),
        );
        ref.read(documentVerificationProvider.notifier).clearError();
      }
    });

    final state = ref.watch(documentVerificationProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Perfil de atuação')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Envie seus documentos para análise da equipe GIUCAR. A ativação do seu perfil é feita manualmente após a revisão.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          _SubmitDocumentCard(
            docType: _docType,
            onDocTypeChanged: (value) => setState(() => _docType = value),
            pickedFileName: _pickedFile?.name,
            onPickFile: _pickFile,
            isSubmitting: state.isSubmitting,
            onSubmit: _submit,
          ),
          const SizedBox(height: 20),
          Text(
            'Documentos enviados',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
          ),
          const SizedBox(height: 8),
          if (state.isLoading && state.documents.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
              ),
            )
          else if (state.documents.isEmpty)
            const _EmptyDocumentsState()
          else
            ...state.documents.map(
              (doc) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _DocumentCard(document: doc),
              ),
            ),
        ],
      ),
    );
  }
}

class _SubmitDocumentCard extends StatelessWidget {
  const _SubmitDocumentCard({
    required this.docType,
    required this.onDocTypeChanged,
    required this.pickedFileName,
    required this.onPickFile,
    required this.isSubmitting,
    required this.onSubmit,
  });

  final String docType;
  final ValueChanged<String> onDocTypeChanged;
  final String? pickedFileName;
  final VoidCallback onPickFile;
  final bool isSubmitting;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enviar novo documento',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: docType,
              dropdownColor: AppColors.surface,
              decoration: const InputDecoration(labelText: 'Tipo de documento'),
              items: _docTypeOptions
                  .map((type) => DropdownMenuItem(value: type, child: Text(_docTypeLabels[type]!)))
                  .toList(),
              onChanged: (value) {
                if (value != null) onDocTypeChanged(value);
              },
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onPickFile,
              icon: const Icon(Icons.attach_file_rounded),
              label: Text(pickedFileName ?? 'Escolher arquivo'),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: (isSubmitting || pickedFileName == null) ? null : onSubmit,
                child: Text(isSubmitting ? 'Enviando...' : 'Enviar documento'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  const _DocumentCard({required this.document});

  final DocumentVerification document;

  Color _statusColor() {
    switch (document.status) {
      case DocumentVerificationStatus.approved:
        return AppColors.primary;
      case DocumentVerificationStatus.rejected:
        return AppColors.error;
      case DocumentVerificationStatus.pending:
        return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _statusColor();
    return NeonSurface(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _docTypeLabels[document.docType] ?? document.docType,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    document.fileUrl,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: color),
              ),
              child: Text(
                document.status.label,
                style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyDocumentsState extends StatelessWidget {
  const _EmptyDocumentsState();

  @override
  Widget build(BuildContext context) {
    return NeonSurface(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(Icons.description_outlined, color: AppColors.textMuted, size: 32),
            const SizedBox(height: 8),
            Text(
              'Nenhum documento enviado ainda.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
