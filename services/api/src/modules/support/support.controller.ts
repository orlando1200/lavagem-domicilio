    return this.supportService.getById(id, user.userId, user.role);
  }

  @Patch('tickets/:id/close')
  @Roles(UserRole.client, UserRole.driver, UserRole.admin)
  @ApiOperation({ summary: 'Close own support ticket' })
  closeMine(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.supportService.closeMine(id, user.userId);
  }
}
