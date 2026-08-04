import type { Service, VehicleSize } from '@/types';
import { VEHICLE_SIZE_LABELS } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  slug: z.string().min(2, 'Slug obrigatório'),
  serviceMode: z.enum(['main', 'addon', 'premium', 'marketplace_related'] as const).default('main'),
  estimatedDurationMinutes: z.number().int().min(1).default(60),
  requiresSpecialEquipment: z.boolean().default(false),
  requiresCertification: z.boolean().default(false),
  riskLevel: z.enum(['low', 'medium', 'high'] as const).default('low'),
  active: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

const SIZES: VehicleSize[] = ['small', 'medium', 'large', 'suv', 'truck'];







































































  const { register, handleSubmit, reset, setValue: setFormValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  function openCreate() {
    setEditing(null);
    reset({
      name: '', description: '', categoryId: '', slug: '',
      serviceMode: 'main', estimatedDurationMinutes: 60,
      requiresSpecialEquipment: false, requiresCertification: false,
      riskLevel: 'low', active: true,
    });
    setOpen(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    reset({
      name: s.name, description: s.description ?? '', categoryId: s.categoryId,
      slug: s.slug ?? '', serviceMode: (s.serviceMode as any) ?? 'main',
      estimatedDurationMinutes: s.estimatedDurationMinutes ?? 60,
      requiresSpecialEquipment: s.requiresSpecialEquipment ?? false,
      requiresCertification: s.requiresCertification ?? false,
      riskLevel: (s.riskLevel as any) ?? 'low',
      active: s.active,
    });
    setOpen(true);
  }

  async function onSubmit(values: FormData) {
    try {























































































































              <Input placeholder="Ex: Lavagem Completa" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                onValueChange={(v) => setFormValue('categoryId', v)}
                defaultValue={editing?.categoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {catData?.data.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input placeholder="Ex: lavagem-completa" {...register('slug')} />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Modo do serviço</Label>
                <Select
                  onValueChange={(v) => setFormValue('serviceMode', v)}
                  defaultValue={editing?.serviceMode ?? 'main'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Principal</SelectItem>
                    <SelectItem value="addon">Adicional</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="marketplace_related">Marketplace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração estimada (min)</Label>
                <Input
                  type="number"
                  min={1}
                  {...register('estimatedDurationMinutes', { valueAsNumber: true })}
                />
                {errors.estimatedDurationMinutes && <p className="text-xs text-red-500">{errors.estimatedDurationMinutes.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="svc-equipment" {...register('requiresSpecialEquipment')} className="h-4 w-4 rounded" />
                <Label htmlFor="svc-equipment">Equip. especial</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="svc-certification" {...register('requiresCertification')} className="h-4 w-4 rounded" />
                <Label htmlFor="svc-certification">Certificação</Label>
              </div>
              <div className="space-y-2">
                <Label>Risco</Label>
                <Select
                  onValueChange={(v) => setFormValue('riskLevel', v)}
                  defaultValue={editing?.riskLevel ?? 'low'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Descrição do serviço" {...register('description')} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="svc-active" {...register('active')} className="h-4 w-4 rounded" />
              <Label htmlFor="svc-active">Ativo</Label>
