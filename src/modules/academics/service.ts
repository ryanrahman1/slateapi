// service.ts
import { supabase } from "../../config/supabase"

interface ProfileData {
  school_id?: string | null
  wgpa?: number | null
  uwgpa?: number | null
  sat_score?: number | null
  sat_reading?: number | null
  sat_math?: number | null
  act_score?: number | null
  class_rank?: number | null
  class_size?: number | null
  graduation_year?: number | null
  major_interest?: string[] | null
}

export class AcademicsService {
  
  // Get profile, create empty one if doesn't exist
  static async getOrCreateProfile(userId: string) {
    const { data: profile, error } = await supabase
      .schema('academics')
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      // Profile doesn't exist, create empty one
      if (error.code === 'PGRST116') {
        return this.createEmptyProfile(userId)
      }
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }
    
    return profile
  }
  
  // Create empty profile
  private static async createEmptyProfile(userId: string) {
    const { data: profile, error } = await supabase
      .schema('academics')
      .from('user_profile')
      .insert({ user_id: userId })
      .select('*')
      .single()
    
    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`)
    }
    
    return profile
  }
  
  // Upsert profile (create or update)
  static async upsertProfile(userId: string, data: ProfileData) {
    // Filter out undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    )
    
    const { data: profile, error } = await supabase
      .schema('academics')
      .from('user_profile')
      .upsert(
        {
          user_id: userId,
          ...cleanData,
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'user_id' 
        }
      )
      .select('*')
      .single()
    
    if (error) {
      throw new Error(`Failed to save profile: ${error.message}`)
    }
    
    return profile
  }
}