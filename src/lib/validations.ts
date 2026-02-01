import { z } from 'zod'

// ==================== AUTH ====================

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Pelo menos um número'),
})

// ==================== CAMPAIGNS ====================

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  listId: z.string().cuid().optional(),
  minIntervalSeconds: z.number().int().min(10).max(600).optional(),
  maxIntervalSeconds: z.number().int().min(10).max(600).optional(),
  scheduledAt: z.string().datetime().optional(),
  messages: z
    .array(
      z.object({
        content: z.string().min(1).max(4096),
        mediaType: z.enum(['text', 'image', 'audio', 'video']).optional(),
        mediaUrl: z.string().url().optional(),
        mediaName: z.string().optional(),
      })
    )
    .optional(),
  whatsappNumberIds: z.array(z.string().cuid()).optional(),
})

// ==================== TEMPLATES ====================

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  category: z.string().max(100).optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório').max(4096),
  mediaType: z.enum(['text', 'image', 'audio', 'video']).optional(),
  mediaUrl: z.string().url().optional(),
  mediaName: z.string().optional(),
})

export const updateTemplateSchema = createTemplateSchema.partial()

// ==================== WEBHOOKS ====================

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url('URL inválida'),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento'),
  secret: z.string().optional(),
})

export const updateWebhookSchema = createWebhookSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// ==================== CRM ====================

export const createDealSchema = z.object({
  title: z.string().min(1).max(200),
  stageId: z.string().cuid(),
  contactId: z.string().cuid().optional(),
  value: z.number().positive().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  company: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  expectedCloseDate: z.string().datetime().optional(),
})

export const updateDealSchema = createDealSchema.partial()

export const createStageSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  orderIndex: z.number().int().min(0).optional(),
  isFinal: z.boolean().optional(),
  isWon: z.boolean().optional(),
})

export const createDealActivitySchema = z.object({
  activityType: z.enum(['note', 'call', 'whatsapp', 'email', 'stage_change', 'task_completed']),
  content: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const createDealTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

// ==================== SETTINGS ====================

export const updateSettingsSchema = z.object({
  anthropicApiKey: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
})

// ==================== HELPERS ====================

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error?: never } | { data?: never; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issues = result.error.issues
    const firstError = issues[0]
    return { error: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Dados inválidos' }
  }
  return { data: result.data }
}
