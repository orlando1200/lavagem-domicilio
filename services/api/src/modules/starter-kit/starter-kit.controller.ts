export class AdminStarterKitController {
  constructor(private readonly starterKitService: StarterKitService) {}

  @Get('config')
  @ApiOperation({ summary: 'List all starter kit configs (admin)' })
  @ApiOkResponse({ description: 'Array of StarterKitConfig records with product info' })
  getConfigs() {
    return this.starterKitService.adminGetConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Upsert active starter kit config (admin)' })
  @ApiOkResponse({ description: 'Updated or created StarterKitConfig' })
  upsertConfig(@Body() dto: UpdateStarterKitConfigDto) {
    return this.starterKitService.adminUpsertActiveConfig(dto);
  }

  @Put('config/:id')
  @ApiOperation({ summary: 'Update a starter kit config by id (admin)' })
  @ApiParam({ name: 'id', type: String, description: 'StarterKitConfig UUID' })
  @ApiOkResponse({ description: 'Updated StarterKitConfig' })
  @ApiNotFoundResponse({ description: 'Config not found' })
  updateConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStarterKitConfigDto,
  ) {
    return this.starterKitService.adminUpdateConfig(id, dto);
  }
}

