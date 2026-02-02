import { supabase } from '../../config/supabase'
import type {
  SearchTasksQuery,
  SearchGoalsQuery,
  CreateTaskInput,
  UpdateTaskInput,
  CreateGoalInput,
  UpdateGoalInput
} from './schemas'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

export class TasksService {
  // --- Tasks ---

  static async listTasks(
    userId: string,
    opts: SearchTasksQuery
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { category, completed, limit = 20, offset = 0 } = opts

    let q = supabase
      .schema('tasks')
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (category) q = q.eq('category', category)
    if (completed !== undefined) q = q.eq('completed', completed)

    const { data, error, count } = await q
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return {
      data: (data ?? []) as Record<string, unknown>[],
      total: count ?? 0,
      limit,
      offset
    }
  }

  static async getTaskById(
    userId: string,
    taskId: string
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .schema('tasks')
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch task: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  static async createTask(
    userId: string,
    input: CreateTaskInput
  ): Promise<Record<string, unknown>> {
    const cleanData = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    ) as Record<string, unknown>

    const { data, error } = await supabase
      .schema('tasks')
      .from('tasks')
      .insert({
        user_id: userId,
        ...cleanData,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  static async updateTask(
    userId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<Record<string, unknown>> {
    const cleanData = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    ) as Record<string, unknown>

    const { data, error } = await supabase
      .schema('tasks')
      .from('tasks')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  static async toggleTask(
    userId: string,
    taskId: string
  ): Promise<Record<string, unknown>> {
    const task = await this.getTaskById(userId, taskId)
    if (!task) return null as unknown as Record<string, unknown>

    const completed = !(task.completed as boolean)
    const completed_at = completed ? new Date().toISOString() : null

    const { data, error } = await supabase
      .schema('tasks')
      .from('tasks')
      .update({
        completed,
        completed_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to toggle task: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  static async deleteTask(userId: string, taskId: string): Promise<void> {
    const { error } = await supabase
      .schema('tasks')
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }

  // --- Goals ---

  static async listGoals(
    userId: string,
    opts: SearchGoalsQuery
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { completed, goal_type, limit = 20, offset = 0 } = opts

    let q = supabase
      .schema('tasks')
      .from('goals')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (completed !== undefined) q = q.eq('completed', completed)
    if (goal_type) q = q.eq('goal_type', goal_type)

    const { data, error, count } = await q
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch goals: ${error.message}`)
    }

    return {
      data: (data ?? []) as Record<string, unknown>[],
      total: count ?? 0,
      limit,
      offset
    }
  }

  static async getGoalById(
    userId: string,
    goalId: string
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .schema('tasks')
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch goal: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  static async createGoal(
    userId: string,
    input: CreateGoalInput
  ): Promise<Record<string, unknown>> {
    const cleanData = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    ) as Record<string, unknown>

    const { data, error } = await supabase
      .schema('tasks')
      .from('goals')
      .insert({
        user_id: userId,
        ...cleanData,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create goal: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  static async updateGoal(
    userId: string,
    goalId: string,
    input: UpdateGoalInput
  ): Promise<Record<string, unknown>> {
    const cleanData = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    ) as Record<string, unknown>

    const { data, error } = await supabase
      .schema('tasks')
      .from('goals')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update goal: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  static async deleteGoal(userId: string, goalId: string): Promise<void> {
    const { error } = await supabase
      .schema('tasks')
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete goal: ${error.message}`)
    }
  }
}
