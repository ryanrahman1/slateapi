// routes.ts
import type { FastifyPluginAsync } from "fastify"
import { requireAuth } from "../../plugins/auth"
import { supabase } from "../../config/supabase"
import { AcademicsService } from "./service"
import { ProfileSchema } from "./schemas"

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

  



}

export default routes