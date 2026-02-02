import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../plugins/auth'
import { EssaysService } from './service'
import {
  SearchEssayPromptsQuerySchema,
  SearchUserEssaysQuerySchema,
  SearchExampleEssaysQuerySchema,
  CreateUserEssaySchema,
  UpdateUserEssaySchema
} from './schemas'
import { supabase } from '../../config/supabase'

const routes: FastifyPluginAsync = async (app) => {
  // --- Essay Prompts ---

  // GET /api/essays/prompts - List all prompts (with pagination & filters)
  app.get('/prompts', { preHandler: [requireAuth] }, async (request, reply) => {
    const validation = SearchEssayPromptsQuerySchema.safeParse(request.query)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
      })
    }

    try {
      const result = await EssaysService.listPrompts(validation.data)
      return reply.status(200).send(result)
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({
        error: 'Failed to fetch essay prompts'
      })
    }
  })

  // GET /api/essays/prompts/:id - Get specific prompt
  app.get<{ Params: { id: string } }>(
    '/prompts/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params

      try {
        const prompt = await EssaysService.getPromptById(id)
        if (!prompt) {
          return reply.status(404).send({ error: 'Essay prompt not found' })
        }
        return reply.status(200).send({ prompt })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({
          error: 'Failed to fetch essay prompt'
        })
      }
    }
  )

  // --- User Essays ---

  // GET /api/essays/user - Get user's essays (with pagination & filters)
  app.get('/user', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId as string

    const validation = SearchUserEssaysQuerySchema.safeParse(request.query)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
      })
    }

    try {
      const result = await EssaysService.listUserEssays(userId, validation.data)
      return reply.status(200).send(result)
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({
        error: 'Failed to fetch user essays'
      })
    }
  })

  // GET /api/essays/user/:id - Get specific essay
  app.get<{ Params: { id: string } }>(
    '/user/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      try {
        const essay = await EssaysService.getUserEssayById(userId, id)
        if (!essay) {
          return reply.status(404).send({ error: 'Essay not found' })
        }
        return reply.status(200).send({ essay })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({
          error: 'Failed to fetch essay'
        })
      }
    }
  )

  // POST /api/essays/user - Create essay
  app.post('/user', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId as string

    const validation = CreateUserEssaySchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
      })
    }

    try {
      const essay = await EssaysService.createEssay(userId, validation.data)
      return reply.status(201).send({ essay })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({
        error: 'Failed to create essay'
      })
    }
  })

  // PATCH /api/essays/user/:id - Update essay (auto-save)
  app.patch<{ Params: { id: string } }>(
    '/user/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      const validation = UpdateUserEssaySchema.safeParse(request.body)
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: validation.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message
          }))
        })
      }

      try {
        const essay = await EssaysService.updateEssay(userId, id, validation.data)
        return reply.status(200).send({ essay })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({
          error: 'Failed to update essay'
        })
      }
    }
  )

  // DELETE /api/essays/user/:id - Delete essay
  app.delete<{ Params: { id: string } }>(
    '/user/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      try {
        await EssaysService.deleteEssay(userId, id)
        return reply.status(200).send({ success: true })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({
          error: 'Failed to delete essay'
        })
      }
    }
  )

  // --- Example Essays ---

  // GET /api/essays/examples/:promptId - Example essays for prompt (with pagination)
  app.get<{ Params: { promptId: string } }>(
    '/examples/:promptId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { promptId } = request.params

      const validation = SearchExampleEssaysQuerySchema.safeParse(request.query)
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Invalid query parameters',
          details: validation.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message
          }))
        })
      }

      try {
        const result = await EssaysService.listExampleEssaysByPrompt(
          promptId,
          validation.data
        )
        return reply.status(200).send(result)
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({
          error: 'Failed to fetch example essays'
        })
      }
    }
  )


  //get versions
  app.get<{ Params: { id: string } }>(
    '/user/:id/versions',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      try {
        // Verify ownership
        const essay = await EssaysService.getUserEssayById(userId, id)
        if (!essay) {
          return reply.status(404).send({ error: 'Essay not found' })
        }

        // Get versions
        const { data: versions, error } = await supabase
          .schema('essays')
          .from('essay_versions')
          .select('version, word_count, created_at')
          .eq('essay_id', id)
          .order('version', { ascending: false })

        if (error) {
          throw new Error(`Failed to fetch versions: ${error.message}`)
        }

        return reply.status(200).send({ versions })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to fetch versions' })
      }
    }
  )

  //get specific version
  app.get<{ Params: { id: string; version: string } }>(
    '/user/:id/versions/:version',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id, version } = request.params

      try {
        // Verify ownership
        const essay = await EssaysService.getUserEssayById(userId, id)
        if (!essay) {
          return reply.status(404).send({ error: 'Essay not found' })
        }

        const { data: versionData, error } = await supabase
          .schema('essays')
          .from('essay_versions')
          .select('*')
          .eq('essay_id', id)
          .eq('version', parseInt(version))
          .single()

        if (error || !versionData) {
          return reply.status(404).send({ error: 'Version not found' })
        }

        return reply.status(200).send({ version: versionData })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to fetch version' })
      }
    }
  )
}

export default routes
