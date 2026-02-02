import { z } from 'zod'

// --- Query param helpers for pagination ---
const paginationDefaults = {
  limit: 20,
  offset: 0
}

const limitSchema = z.coerce.number().int().min(1).max(100).default(paginationDefaults.limit).optional()
const offsetSchema = z.coerce.number().int().min(0).default(paginationDefaults.offset).optional()

// --- Essay Prompts ---

export const SearchEssayPromptsQuerySchema = z.object({
  query: z.string().min(1).max(200).optional(),
  limit: limitSchema,
  offset: offsetSchema,
  college_id: z.uuid().optional(),
  prompt_type: z.enum(['common_app', 'coalition', 'uc', 'college_specific']).optional(), // FIXED: match DB
  year: z.coerce.number().int().min(2000).max(2030).optional(),
  is_active: z.coerce.boolean().optional(),
})

export type SearchEssayPromptsQuery = z.infer<typeof SearchEssayPromptsQuerySchema>

// --- User Essays ---

export const SearchUserEssaysQuerySchema = z.object({
  limit: limitSchema,
  offset: offsetSchema,
  status: z.enum(['draft', 'in_review', 'final', 'submitted']).optional(), // FIXED: match DB
  user_college_id: z.uuid().optional(),
  prompt_id: z.uuid().optional(),
})

export type SearchUserEssaysQuery = z.infer<typeof SearchUserEssaysQuerySchema>

// TipTap HTML content
const tipTapContentSchema = z.string().max(100_000).optional()

export const CreateUserEssaySchema = z.object({
  user_college_id: z.uuid().nullable().optional(),
  prompt_id: z.uuid().nullable().optional(),
  title: z.string().min(1).max(500),
  content: tipTapContentSchema,
  notes: z.string().max(5000).optional(),
  status: z.enum(['draft', 'in_review', 'final', 'submitted']).default('draft').optional(), // FIXED
  ai_suggestions_enabled: z.boolean().default(true).optional(),
  // REMOVED: word_count (auto-calculated server-side)
})

export type CreateUserEssayInput = z.infer<typeof CreateUserEssaySchema>

export const UpdateUserEssaySchema = z.object({
  user_college_id: z.uuid().nullable().optional(),
  prompt_id: z.uuid().nullable().optional(),
  title: z.string().min(1).max(500).optional(),
  content: tipTapContentSchema,
  notes: z.string().max(5000).optional(),
  status: z.enum(['draft', 'in_review', 'final', 'submitted']).optional(), // FIXED
  ai_suggestions_enabled: z.boolean().optional(),
  // REMOVED: word_count (auto-calculated server-side)
})

export type UpdateUserEssayInput = z.infer<typeof UpdateUserEssaySchema>


export const SearchExampleEssaysQuerySchema = z.object({
  limit: limitSchema,
  offset: offsetSchema,
  sort: z.enum(['upvotes', 'created_at']).default('upvotes').optional(),
})

export type SearchExampleEssaysQuery = z.infer<typeof SearchExampleEssaysQuerySchema>