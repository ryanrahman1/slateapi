import { supabase } from '../../config/supabase'
import type {
  SearchEssayPromptsQuery,
  SearchUserEssaysQuery,
  SearchExampleEssaysQuery,
  CreateUserEssayInput,
  UpdateUserEssayInput
} from './schemas'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

/**
 * Count words in HTML/TipTap content by stripping tags and counting words
 */
function countWordsFromHtml(html: string | null | undefined): number {
  if (!html || typeof html !== 'string') return 0
  const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return stripped ? stripped.split(/\s+/).length : 0
}

export class EssaysService {
  // --- Essay Prompts ---

  static async listPrompts(
    opts: SearchEssayPromptsQuery
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { query, limit = 20, offset = 0, college_id, prompt_type, year, is_active } = opts

    let q = supabase
      .schema('essays')
      .from('essay_prompts')
      .select('*', { count: 'exact' })

    if (college_id) {
      q = q.eq('college_id', college_id)
    }
    if (prompt_type) {
      q = q.eq('prompt_type', prompt_type)
    }
    if (year !== undefined) {
      q = q.eq('year', year)
    }
    if (is_active !== undefined) {
      q = q.eq('is_active', is_active)
    }
    if (query && query.trim()) {
      q = q.or(`prompt_text.ilike.%${query.trim()}%,prompt_label.ilike.%${query.trim()}%`)
    }

    const { data, error, count } = await q
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch essay prompts: ${error.message}`)
    }

    return {
      data: (data ?? []) as Record<string, unknown>[],
      total: count ?? 0,
      limit,
      offset
    }
  }

  static async getPromptById(id: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .schema('essays')
      .from('essay_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch essay prompt: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  // --- User Essays ---

  static async listUserEssays(
    userId: string,
    opts: SearchUserEssaysQuery
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { limit = 20, offset = 0, status, user_college_id, prompt_id } = opts

    let q = supabase
      .schema('essays')
      .from('user_essays')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (status) q = q.eq('status', status)
    if (user_college_id) q = q.eq('user_college_id', user_college_id)
    if (prompt_id) q = q.eq('prompt_id', prompt_id)

    const { data, error, count } = await q
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch user essays: ${error.message}`)
    }

    return {
      data: (data ?? []) as Record<string, unknown>[],
      total: count ?? 0,
      limit,
      offset
    }
  }

  static async getUserEssayById(
    userId: string,
    essayId: string
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await supabase
      .schema('essays')
      .from('user_essays')
      .select('*')
      .eq('id', essayId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch user essay: ${error.message}`)
    }

    return data as Record<string, unknown>
  }

  // service.ts - Add version tracking

  static async createEssay(
    userId: string,
    input: CreateUserEssayInput
  ): Promise<Record<string, unknown>> {
    const cleanData = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    ) as Record<string, unknown>

    const content = (cleanData.content as string) ?? ''
    const word_count = countWordsFromHtml(content)

    const { data, error } = await supabase
      .schema('essays')
      .from('user_essays')
      .insert({
        user_id: userId,
        ...cleanData,
        word_count,
        version: 1, // ADDED: initial version
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create essay: ${error.message}`)
    }

    // ADDED: Create initial version history
    await supabase
      .schema('essays')
      .from('essay_versions')
      .insert({
        essay_id: data.id,
        version: 1,
        content,
        word_count
      })

    return data as Record<string, unknown>
  }

  static async updateEssay(
    userId: string,
    essayId: string,
    input: UpdateUserEssayInput
  ): Promise<Record<string, unknown>> {
    const cleanData = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    ) as Record<string, unknown>

    const content = cleanData.content as string | undefined

    // Auto-calculate word count if content changed
    if (content !== undefined) {
      cleanData.word_count = countWordsFromHtml(content)
    }

    // ADDED: Get current version
    // not used for now, will implement in better way later
    /*
    const { data: currentEssay } = await supabase
      .schema('essays')
      .from('user_essays')
      .select('version, content')
      .eq('id', essayId)
      .eq('user_id', userId)
      .single()

    const newVersion = (currentEssay?.version ?? 0) + 1
    const shouldSaveVersion = content !== undefined && content !== currentEssay?.content
    */

    const { data, error } = await supabase
      .schema('essays')
      .from('user_essays')
      .update({
        ...cleanData,
        version: 1, // initial version
        updated_at: new Date().toISOString()
      })
      .eq('id', essayId)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update essay: ${error.message}`)
    }

    // ADDED: Save version history if content changed
    /*
    if (shouldSaveVersion && content !== undefined) {
      await supabase
        .schema('essays')
        .from('essay_versions')
        .insert({
          essay_id: essayId,
          version: newVersion,
          content,
          word_count: cleanData.word_count as number
        })
    }
    */

    return data as Record<string, unknown>
  }

  static async deleteEssay(userId: string, essayId: string): Promise<void> {
    const { error } = await supabase
      .schema('essays')
      .from('user_essays')
      .delete()
      .eq('id', essayId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete essay: ${error.message}`)
    }
  }

  // --- Example Essays ---

  static async listExampleEssaysByPrompt(
    promptId: string,
    opts: SearchExampleEssaysQuery
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { limit = 20, offset = 0, sort = 'upvotes' } = opts

    const orderColumn = sort === 'upvotes' ? 'upvotes' : 'created_at'
    const ascending = sort === 'upvotes' ? false : false // both descending

    const { data, error, count } = await supabase
      .schema('essays')
      .from('example_essays')
      .select('*', { count: 'exact' })
      .eq('prompt_id', promptId)
      .eq('is_public', true)
      .order(orderColumn, { ascending })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch example essays: ${error.message}`)
    }

    return {
      data: (data ?? []) as Record<string, unknown>[],
      total: count ?? 0,
      limit,
      offset
    }
  }
}
