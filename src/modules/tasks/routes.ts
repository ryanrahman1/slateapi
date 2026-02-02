import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../plugins/auth'
import { TasksService } from './service'
import {
  SearchTasksQuerySchema,
  SearchGoalsQuerySchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  CreateGoalSchema,
  UpdateGoalSchema
} from './schemas'

const routes: FastifyPluginAsync = async (app) => {
  // --- Tasks ---

  // GET /api/tasks - Fetch all tasks (with filters)
  app.get('/tasks', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId as string

    const validation = SearchTasksQuerySchema.safeParse(request.query)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
      })
    }

    try {
      const result = await TasksService.listTasks(userId, validation.data)
      return reply.status(200).send(result)
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch tasks' })
    }
  })

  // POST /api/tasks - Create a new task
  app.post('/tasks/create', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId as string

    const validation = CreateTaskSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
      })
    }

    try {
      const task = await TasksService.createTask(userId, validation.data)
      return reply.status(201).send({ task })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create task' })
    }
  })

  // GET /api/tasks/:id - Get specific task
  app.get<{ Params: { id: string } }>(
    '/tasks/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      try {
        const task = await TasksService.getTaskById(userId, id)
        if (!task) {
          return reply.status(404).send({ error: 'Task not found' })
        }
        return reply.status(200).send({ task })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to fetch task' })
      }
    }
  )

  // PATCH /api/tasks/:id - Update task
  app.patch<{ Params: { id: string } }>(
    '/tasks/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      const validation = UpdateTaskSchema.safeParse(request.body)
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
        })
      }

      try {
        const task = await TasksService.updateTask(userId, id, validation.data)
        return reply.status(200).send({ task })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to update task' })
      }
    }
  )

  // PATCH /api/tasks/:id/toggle - Toggle completed status
  app.patch<{ Params: { id: string } }>(
    '/tasks/:id/toggle',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      try {
        const task = await TasksService.toggleTask(userId, id)
        if (!task) {
          return reply.status(404).send({ error: 'Task not found' })
        }
        return reply.status(200).send({ task })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to toggle task' })
      }
    }
  )

  // DELETE /api/tasks/:id - Remove task
  app.delete<{ Params: { id: string } }>(
    '/tasks/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      try {
        await TasksService.deleteTask(userId, id)
        return reply.status(200).send({ success: true })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to delete task' })
      }
    }
  )

  // --- Goals ---

  // GET /api/goals - List all goals
  app.get('/goals', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId as string

    const validation = SearchGoalsQuerySchema.safeParse(request.query)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
      })
    }

    try {
      const result = await TasksService.listGoals(userId, validation.data)
      return reply.status(200).send(result)
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch goals' })
    }
  })

  // POST /api/goals - Create a new goal
  app.post('/goals/create', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId as string

    const validation = CreateGoalSchema.safeParse(request.body)
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
      })
    }

    try {
      const goal = await TasksService.createGoal(userId, validation.data)
      return reply.status(201).send({ goal })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Failed to create goal' })
    }
  })

  // GET /api/goals/:id - Get specific goal
  app.get<{ Params: { id: string } }>(
    '/goals/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      try {
        const goal = await TasksService.getGoalById(userId, id)
        if (!goal) {
          return reply.status(404).send({ error: 'Goal not found' })
        }
        return reply.status(200).send({ goal })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to fetch goal' })
      }
    }
  )

  // PATCH /api/goals/:id - Update goal
  app.patch<{ Params: { id: string } }>(
    '/goals/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      const validation = UpdateGoalSchema.safeParse(request.body)
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: validation.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
        })
      }

      try {
        const goal = await TasksService.updateGoal(userId, id, validation.data)
        return reply.status(200).send({ goal })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to update goal' })
      }
    }
  )

  // DELETE /api/goals/:id - Delete goal (cascade deletes milestones)
  app.delete<{ Params: { id: string } }>(
    '/goals/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.userId as string
      const { id } = request.params

      try {
        await TasksService.deleteGoal(userId, id)
        return reply.status(200).send({ success: true })
      } catch (err) {
        app.log.error(err)
        return reply.status(500).send({ error: 'Failed to delete goal' })
      }
    }
  )
}

export default routes
