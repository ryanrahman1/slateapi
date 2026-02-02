// routes.ts
import type { FastifyPluginAsync } from "fastify"
import { requireAuth } from "../../plugins/auth"
import { supabase } from "../../config/supabase"
import { AcademicsService } from "./service"
import { CreateCourseSchema, UpdateCourseSchema, ProfileSchema, CreateExtracurricularSchema } from "./schemas"

const routes: FastifyPluginAsync = async (app) => {

  // GET profile (create if doesn't exist)
  app.get('/profile', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string

    try {
      const profile = await AcademicsService.getOrCreateProfile(userId)
      return reply.status(200).send({ profile })
    } catch (error) {
      console.error('Profile fetch error:', error)
      return reply.status(500).send({
        error: 'Failed to fetch profile'
      })
    }
  })

  // POST/PATCH profile (upsert)
  app.post('/profile', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string

    // Validate input
    const validation = ProfileSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues.map((error) => ({
          path: error.path.join('.'),
          message: error.message
        }))
      })
    }

    try {
      const profile = await AcademicsService.upsertProfile(
        userId,
        validation.data
      )
      return reply.status(200).send({ profile })
    } catch (error) {
      console.error('Profile upsert error:', error)
      return reply.status(500).send({
        error: 'Failed to save profile'
      })
    }
  })


  /// courses
  app.get('/courses', { preHandler: requireAuth }, async (request, reply) => { //TODO: add pagination and filtering
    const userId = request.userId as string

    try {
      const { data: courses, error } = await supabase
        .schema('academics')
        .from('user_courses')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('semester', { ascending: false })
      if (error) {
        throw new Error(`Failed to fetch courses: ${error.message}`)
      }
      return reply.status(200).send({ courses })
    } catch (error) {
      console.error('Courses fetch error:', error)
      return reply.status(500).send({
        error: 'Failed to fetch courses'
      })
    }
  })


  app.post('/courses/create', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string
    // Validate input
    const validation = CreateCourseSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues.map((error) => ({
          path: error.path.join('.'),
          message: error.message
        }))
      })
    }

    try {
      const course = await AcademicsService.createCourse(
        userId,
        validation.data
      )
      return reply.status(200).send({ course })
    } catch (error) {
      console.error('Course create error:', error)
      return reply.status(500).send({
        error: 'Failed to save course'
      })
    }
  })

  app.patch('/courses/:courseId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string
    const { courseId } = request.params as { courseId: string }

    // Validate input
    const validation = UpdateCourseSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues.map((error) => ({
          path: error.path.join('.'),
          message: error.message
        }))
      })
    }

    try {
      const course = await AcademicsService.updateCourse(
        userId,
        courseId,
        validation.data
      )
      return reply.status(200).send({ course })
    } catch (error) {
      console.error('Course update error:', error)
      return reply.status(500).send({
        error: 'Failed to update course'
      })
    }
  })

  app.delete('/courses/:courseId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string
    const { courseId } = request.params as { courseId: string }

    try {
      const { error } = await supabase
        .schema('academics')
        .from('user_courses')
        .delete()
        .eq('id', courseId)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to delete course: ${error.message}`)
      }

      return reply.status(200).send({ success: true })
    } catch (error) {
      console.error('Course delete error:', error)
      return reply.status(500).send({ error: 'Failed to delete course' })
    }
  })

  // ecs

  app.get('/extracurriculars', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string

    const { data: ecs, error } = await supabase
      .schema('academics')
      .from('extracurriculars')
      .select("*")
      .eq('user_id', userId)

    if (error) {
      console.error('Extracurriculars fetch error:', error)
      return reply.status(500).send({
        error: 'Failed to fetch extracurriculars'
      })
    }

    return reply.status(200).send({ extracurriculars: ecs })
  })

  app.post('/extracurriculars/create', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string

    // Validate input
    const validation = CreateExtracurricularSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues.map((error) => ({
          path: error.path.join('.'),
          message: error.message
        }))
      })
    }

    try {
      const ec = await AcademicsService.createExtracurricular(
        userId,
        validation.data
      )
      return reply.status(200).send({ extracurricular: ec })
    }
    catch (error) {
      console.error('Extracurricular create error:', error)
      return reply.status(500).send({
        error: 'Failed to save extracurricular'
      })
    }
  })

  app.patch('/extracurriculars/:ecId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string
    const { ecId } = request.params as { ecId: string }

    // Validate input
    const validation = CreateExtracurricularSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues.map((error) => ({
          path: error.path.join('.'),
          message: error.message
        }))
      })
    }

    try {
      const ec = await AcademicsService.updateExtracurricular(
        userId,
        ecId,
        validation.data
      )
      return reply.status(200).send({ extracurricular: ec })
    } catch (error) {
      console.error('Extracurricular update error:', error)
      return reply.status(500).send({
        error: 'Failed to update extracurricular'
      })
    }
  })

  app.delete('/extracurriculars/:ecId', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string
    const { ecId } = request.params as { ecId: string }

    try {
      const { error } = await supabase
        .schema('academics')
        .from('extracurriculars')
        .delete()
        .eq('id', ecId)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to delete extracurricular: ${error.message}`)
      }

      return reply.status(200).send({ success: true })
    } catch (error) {
      console.error('Extracurricular delete error:', error)
      return reply.status(500).send({ error: 'Failed to delete extracurricular' })
    }
  })

  // GPA

  app.post('/gpa/calculate', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string

    try {
      const gpaResult = await AcademicsService.calculateGPA(userId)
      return reply.status(200).send({ gpa: gpaResult })
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to calculate GPA: ' + (error instanceof Error ? error.message : '')
      })
    }
  })

  // GET stats (dashboard summary)
  app.get('/stats', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId as string

    try {
      // Get profile
      const profile = await AcademicsService.getOrCreateProfile(userId)

      // Count courses
      const { count: coursesCount } = await supabase
        .schema('academics')
        .from('user_courses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Count extracurriculars
      const { count: ecsCount } = await supabase
        .schema('academics')
        .from('extracurriculars')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Calculate profile completeness
      const fields = [
        profile.wgpa, profile.uwgpa, profile.sat_score,
        profile.graduation_year, profile.school_id, profile.major_interest
      ]
      const completedFields = fields.filter(f => f !== null && f !== undefined).length
      const profileCompleteness = Math.round((completedFields / fields.length) * 100)

      return reply.status(200).send({
        gpa: {
          weighted: profile.wgpa,
          unweighted: profile.uwgpa
        },
        test_scores: {
          sat: profile.sat_score,
          sat_reading: profile.sat_reading,
          sat_math: profile.sat_math,
          act: profile.act_score
        },
        courses_count: coursesCount || 0,
        extracurriculars_count: ecsCount || 0,
        profile_completeness: profileCompleteness
      })
    } catch (error) {
      console.error('Stats fetch error:', error)
      return reply.status(500).send({ error: 'Failed to fetch stats' })
    }
  })

}

export default routes