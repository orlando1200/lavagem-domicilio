import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/neon_surface.dart';
import '../../data/models/driver_location_model.dart';
import '../../data/orders_repository.dart';

/// Mapa de acompanhamento em tempo real: posicao do lavador (polling
/// a cada 12s em GET /orders/:id/driver-location) + pin fixo do
/// endereco do pedido. So deve ser montado quando `order.isTrackable`
/// (ver OrderModel) — assume que ha endereco com coordenadas.
class OrderTrackingMap extends ConsumerStatefulWidget {
  const OrderTrackingMap({
    super.key,
    required this.orderId,
    required this.addressLatitude,
    required this.addressLongitude,
  });

  final String orderId;
  final double addressLatitude;
  final double addressLongitude;

  @override
  ConsumerState<OrderTrackingMap> createState() => _OrderTrackingMapState();
}

class _OrderTrackingMapState extends ConsumerState<OrderTrackingMap> {
  Timer? _pollTimer;
  DriverLocation? _driverLocation;
  bool _loading = true;
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    _poll();
    _pollTimer = Timer.periodic(const Duration(seconds: 12), (_) => _poll());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _poll() async {
    try {
      final location = await ref.read(ordersRepositoryProvider).fetchDriverLocation(widget.orderId);
      if (!mounted) return;
      setState(() {
        _driverLocation = location;
        _loading = false;
      });
      if (location != null) {
        _mapController?.animateCamera(
          CameraUpdate.newLatLng(LatLng(location.latitude, location.longitude)),
        );
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final addressPosition = LatLng(widget.addressLatitude, widget.addressLongitude);
    final driverPosition = _driverLocation != null
        ? LatLng(_driverLocation!.latitude, _driverLocation!.longitude)
        : null;

    return NeonSurface(
      radius: 18,
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: SizedBox(
          height: 220,
          child: Stack(
            children: [
              GoogleMap(
                initialCameraPosition: CameraPosition(target: addressPosition, zoom: 14),
                onMapCreated: (controller) => _mapController = controller,
                markers: {
                  Marker(
                    markerId: const MarkerId('address'),
                    position: addressPosition,
                    icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
                    infoWindow: const InfoWindow(title: 'Seu endereço'),
                  ),
                  if (driverPosition != null)
                    Marker(
                      markerId: const MarkerId('driver'),
                      position: driverPosition,
                      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
                      infoWindow: const InfoWindow(title: 'Seu lavador'),
                    ),
                },
                zoomControlsEnabled: false,
                myLocationButtonEnabled: false,
              ),
              if (_loading)
                const Positioned(
                  top: 12,
                  right: 12,
                  child: SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                  ),
                )
              else if (driverPosition == null)
                Positioned(
                  left: 12,
                  right: 12,
                  bottom: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.surface.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'Aguardando o lavador começar a rota…',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
