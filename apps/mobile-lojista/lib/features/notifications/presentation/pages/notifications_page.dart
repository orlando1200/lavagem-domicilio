import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/notification_item.dart';
import '../../data/notifications_repository.dart';

/// Lista de notificacoes in-app do usuario autenticado
/// (GET /notifications/me), com marcar-como-lida individual e em lote.
class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  List<NotificationItem>? _items;
  bool _loading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final items = await ref.read(notificationsRepositoryProvider).fetchMine();
      if (!mounted) return;
      setState(() => _items = items);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAsRead(NotificationItem item) async {
    if (item.read) return;
    final items = _items;
    if (items == null) return;

    final index = items.indexWhere((n) => n.id == item.id);
    if (index == -1) return;

    setState(() {
      _items = [...items]..[index] = item.copyWith(read: true);
    });

    try {
      await ref.read(notificationsRepositoryProvider).markAsRead(item.id);
    } catch (_) {
      // Best-effort visual: se falhar, a proxima recarga corrige o estado.
    }
  }

  Future<void> _markAllAsRead() async {
    final items = _items;
    if (items == null || items.every((n) => n.read)) return;

    setState(() {
      _items = items.map((n) => n.copyWith(read: true)).toList();
    });

    try {
      await ref.read(notificationsRepositoryProvider).markAllAsRead();
    } catch (_) {
      // Best-effort visual: se falhar, a proxima recarga corrige o estado.
    }
  }

  String _formatDate(DateTime date) {
    final local = date.toLocal();
    return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')} às '
        '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    final hasUnread = items != null && items.any((n) => !n.read);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notificações'),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('Marcar todas como lidas'),
            ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: _buildBody(items),
        ),
      ),
    );
  }

  Widget _buildBody(List<NotificationItem>? items) {
    if (_loading && items == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_errorMessage != null && items == null) {
      return ListView(
        children: [
          const SizedBox(height: 80),
          Text(_errorMessage!, style: const TextStyle(color: AppColors.error), textAlign: TextAlign.center),
        ],
      );
    }
    if (items == null || items.isEmpty) {
      return ListView(
        children: [
          const SizedBox(height: 100),
          Icon(Icons.notifications_none_rounded, size: 48, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Text(
            'Nenhuma notificação por aqui ainda.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            onTap: () => _markAsRead(item),
            borderRadius: BorderRadius.circular(16),
            child: NeonSurface(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!item.read)
                    Container(
                      margin: const EdgeInsets.only(top: 6, right: 10),
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                    )
                  else
                    const SizedBox(width: 18),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.title,
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: item.read ? FontWeight.w500 : FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(item.body, style: TextStyle(color: AppColors.textSecondary)),
                        const SizedBox(height: 8),
                        Text(
                          _formatDate(item.createdAt),
                          style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
