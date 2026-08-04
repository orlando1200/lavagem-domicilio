      // Use mock for dev
      final mock = ref.read(driverOrderRepositoryProvider).mockPendingOrder();
      setState(() {
        _order = mock.copyWith(status: DriverOrderStatus.assigned);
        _loadingOrder = false;
      });
    }
