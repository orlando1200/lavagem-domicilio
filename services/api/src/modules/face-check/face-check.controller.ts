@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/face-checks')
export class AdminFaceCheckController {
  constructor(private readonly faceCheckService: FaceCheckService) {}

