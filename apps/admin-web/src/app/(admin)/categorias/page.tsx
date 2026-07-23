import { formatDate } from '@/lib/utils';
import type { Category } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2, 'Slug obrigatório'),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;















    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function openCreate() {
    setEditing(null);
    reset({ name: '', slug: '', description: '', icon: '', sortOrder: 0, active: true });
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    reset({
      name: cat.name,
      slug: cat.slug ?? '',
      description: cat.description ?? '',
      icon: cat.icon ?? '',
      sortOrder: cat.sortOrder ?? 0,
      active: cat.active,
    });
    setOpen(true);
  }

  async function onSubmit(values: FormData) {
    try {



























































































































            <DialogTitle>{editing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Lavagem Completa" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input placeholder="Ex: lavagem-completa" {...register('slug')} />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ícone (emoji ou texto)</Label>
                <Input placeholder="Ex: 🚗" {...register('icon')} />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  min={0}
                  {...register('sortOrder', { valueAsNumber: true })}
                />
                {errors.sortOrder && <p className="text-xs text-red-500">{errors.sortOrder.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Descrição da categoria" {...register('description')} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" {...register('active')} className="h-4 w-4 rounded" />
              <Label htmlFor="active">Ativo</Label>
