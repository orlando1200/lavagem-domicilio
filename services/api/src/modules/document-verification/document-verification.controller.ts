@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/document-verification')
export class AdminDocumentVerificationController {
  constructor(
    private readonly documentVerificationService: DocumentVerificationService,
