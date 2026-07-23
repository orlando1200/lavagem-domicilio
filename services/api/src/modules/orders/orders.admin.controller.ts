    return this.ordersService.assignDriver(id, dto.driverUserId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status as admin' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const backendStatus = this.ordersService['mapClientStatusToOrderStatus'](dto.status);
    return this.ordersService.updateStatusAsAdmin(id, backendStatus, dto.note || dto.reason);
  }

  @Get(':id/chat')
  @ApiOperation({ summary: 'Get order chat messages' })
