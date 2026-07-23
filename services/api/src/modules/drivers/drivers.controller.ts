    return this.driversService.acceptOrder(orderId, user.userId);
  }

  @Post('orders/:orderId/reject')
  @Roles(UserRole.driver)
  @ApiOperation({ summary: 'Reject an available order' })
  rejectOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driversService.rejectOrder(orderId, user.userId);
  }

  @Post('orders/:orderId/status')
  @Roles(UserRole.driver)
  @ApiOperation({ summary: 'Update order status' })
  updateOrderStatus(
