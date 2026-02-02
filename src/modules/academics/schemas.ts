import { z } from 'zod'

// Profile Schema
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

// Course Schemas
const CreateCourseSchema = z.object({
  course_name: z.string().min(1).max(100),
  grade: z.string().max(3).optional(), // A+, B-, etc (up to 3 chars)
  grade_numeric: z.number().min(0).max(100).optional(), // 0-100 percentage
  credits: z.number().min(0).max(10).optional(),
  is_ap: z.boolean().optional(),
  is_honors: z.boolean().optional(),
  semester: z.enum(['Fall', 'Spring', 'Full Year']).optional(), // FIXED: specific values
  year: z.enum(['Freshman', 'Sophomore', 'Junior', 'Senior']).optional() // FIXED: grade level, not year number
})

const UpdateCourseSchema = CreateCourseSchema.partial() // All fields optional

// Extracurricular Schemas  
const CreateExtracurricularSchema = z.object({
  activity_name: z.string().min(1).max(100),
  category: z.enum(['Sport', 'Club', 'Volunteer', 'Work', 'Research', 'Art', 'Other']).optional(),
  position: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  hours_per_week: z.number().int().min(0).max(168).optional(),
  weeks_per_year: z.number().int().min(0).max(52).optional(),
  grade_levels: z.array(z.enum(['9', '10', '11', '12'])).optional(), // FIXED: grade numbers as strings
  awards: z.string().max(500).optional(), // INCREASED: awards can be long
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' }).optional(),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' }).optional()
})

const UpdateExtracurricularSchema = CreateExtracurricularSchema.partial()

export { 
  ProfileSchema, 
  CreateCourseSchema, 
  UpdateCourseSchema, 
  CreateExtracurricularSchema, 
  UpdateExtracurricularSchema 
}