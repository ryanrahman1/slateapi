import { z } from 'zod'

// --- Pagination helpers ---
const limitSchema = z.coerce.number().int().min(1).max(100).default(20).optional()
const offsetSchema = z.coerce.number().int().min(0).default(0).optional()

// --- Tasks ---

export const SearchTasksQuerySchema = z.object({
  category: z.string().max(100).optional(),
  completed: z.coerce.boolean().optional(),
  limit: limitSchema,
  offset: offsetSchema,
})

export type SearchTasksQuery = z.infer<typeof SearchTasksQuerySchema>

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  due_date: z.string().refine((s) => !s || !isNaN(Date.parse(s)), { message: 'Invalid date' }).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
  category: z.string().max(100).optional(),
  related_college_id: z.uuid().nullable().optional(),
  link: z.string().max(500).optional(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>

const optionalDateSchema = z.union([
  z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date' }),
  z.null()
]).optional()

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  due_date: optionalDateSchema,
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().max(100).optional(),
  related_college_id: z.uuid().nullable().optional(),
  link: z.string().max(500).optional(),
})

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>

// --- Goals ---

export const SearchGoalsQuerySchema = z.object({
  completed: z.coerce.boolean().optional(),
  goal_type: z.string().max(50).optional(),
  limit: limitSchema,
  offset: offsetSchema,
})

export type SearchGoalsQuery = z.infer<typeof SearchGoalsQuerySchema>

export const CreateGoalSchema = z.object({
  goal_type: z.string().min(1).max(50),
  title: z.string().min(1).max(500),
  target_value: z.string().min(1).max(1000),
  current_value: z.string().max(1000).optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  deadline: z.string().refine((s) => !s || !isNaN(Date.parse(s)), { message: 'Invalid date' }).optional(),
})

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>

export const UpdateGoalSchema = z.object({
  goal_type: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(500).optional(),
  target_value: z.string().min(1).max(1000).optional(),
  current_value: z.string().max(1000).nullable().optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  deadline: optionalDateSchema,
})

export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>
