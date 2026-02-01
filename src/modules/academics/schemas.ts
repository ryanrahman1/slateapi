import { z } from 'zod'

// Validation schema
const ProfileSchema = z.object({
  school_id: z.uuid().nullable().optional(),
  wgpa: z.number().min(0).max(5.0).nullable().optional(),
  uwgpa: z.number().min(0).max(4.0).nullable().optional(),
  sat_score: z.number().int().min(400).max(1600).nullable().optional(),
  sat_reading: z.number().int().min(200).max(800).nullable().optional(),
  sat_math: z.number().int().min(200).max(800).nullable().optional(),
  act_score: z.number().int().min(1).max(36).nullable().optional(),
  class_rank: z.number().int().positive().nullable().optional(),
  class_size: z.number().int().positive().nullable().optional(),
  graduation_year: z.number().int().min(2024).max(2030).nullable().optional(),
  major_interest: z.array(z.string()).max(5).nullable().optional()
})

export { ProfileSchema }