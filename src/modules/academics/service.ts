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

interface CourseData {
  course_name?: string
  grade?: string
  grade_numeric?: number
  credits?: number
  is_ap?: boolean
  is_honors?: boolean
  semester?: string
  year?: string
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

  /// courses

  // create course
  static async createCourse(userId: string, data: CourseData) {
    // filter out undef values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    )

    const { data: course, error } = await supabase
      .schema("academics")
      .from("user_courses")
      .insert(
        {
          user_id: userId,
          ...cleanData,
          updated_at: new Date().toISOString(),
        }
      )
      .select("*")
      .single()

    if (error) {
      throw new Error(`Failed to save course: ${error.message}`)
    }

    return course
  }

  // update course
  static async updateCourse(userId: string, courseId: string, data: CourseData) {
    // filter out undef values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    )

    const { data: course, error } = await supabase
      .schema("academics")
      .from("user_courses")
      .update(
        {
          ...cleanData,
          updated_at: new Date().toISOString(),
        }
      )
      .eq("user_id", userId)
      .eq("id", courseId)
      .select("*")
      .single()

    if (error) {
      throw new Error(`Failed to update course: ${error.message}`)
    }

    return course
  }

  /// extracurriculars

  // create ec
  static async createExtracurricular(userId: string, data: any) {
    // filter out undef values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    )

    const { data: ec, error } = await supabase
      .schema("academics")
      .from("extracurriculars")
      .insert(
        {
          user_id: userId,
          ...cleanData,
          updated_at: new Date().toISOString(),
        }
      )
      .select("*")
      .single()

    if (error) {
      throw new Error(`Failed to save extracurricular: ${error.message}`)
    }

    return ec
  }

  // update ec
  static async updateExtracurricular(userId: string, ecId: string, data: any) {
    // filter out undef values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    )

    const { data: ec, error } = await supabase
      .schema("academics")
      .from("extracurriculars")
      .update(
        {
          ...cleanData,
          updated_at: new Date().toISOString(),
        }
      )
      .eq("user_id", userId)
      .eq("id", ecId)
      .select("*")
      .single()

    if (error) {
      throw new Error(`Failed to update extracurricular: ${error.message}`)
    }

    return ec
  }

  /// gpa

  //calculate gpa -- based on MCPS weighting system for now; will eventually make this customizable based on your district

  static async calculateGPA(
    userId: string
  ): Promise<{ wgpa: number | null; uwgpa: number | null }> {
    const { data: courses, error } = await supabase
      .schema("academics")
      .from("user_courses")
      .select("grade_numeric, credits, is_ap, is_honors")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to fetch courses for GPA calculation: ${error.message}`);
    }

    if (!courses || courses.length === 0) {
      return { wgpa: null, uwgpa: null };
    }

    const percentToLetter = (percent: number): "A" | "B" | "C" | "D" | "E" => {
      const rounded = Math.floor(percent + 0.5); // MCPS rounding
      if (rounded >= 90) return "A";
      if (rounded >= 80) return "B";
      if (rounded >= 70) return "C";
      if (rounded >= 60) return "D";
      return "E";
    };

    const unweightedPoints = (letter: string): number => {
      switch (letter) {
        case "A": return 4;
        case "B": return 3;
        case "C": return 2;
        case "D": return 1;
        default: return 0;
      }
    };

    // MCPS weighted table (Honors + AP use the SAME table)
    const weightedPoints = (letter: string): number => {
      switch (letter) {
        case "A": return 5;
        case "B": return 4;
        case "C": return 3;
        case "D": return 1;
        default: return 0;
      }
    };

    let uwTotal = 0;
    let wTotal = 0;
    let creditsTotal = 0;

    for (const course of courses) {
      if (course.grade_numeric == null) continue;

      const credits = course.credits && course.credits > 0 ? course.credits : 1.0;
      const letter = percentToLetter(course.grade_numeric);

      const uw = unweightedPoints(letter);
      const isWeighted = course.is_ap || course.is_honors;
      const w = isWeighted ? weightedPoints(letter) : uw;

      uwTotal += uw * credits;
      wTotal += w * credits;
      creditsTotal += credits;
    }

    if (creditsTotal === 0) {
      return { wgpa: null, uwgpa: null };
    }

    // MCPS transcript format: two decimals
    const uwgpa = Number((uwTotal / creditsTotal).toFixed(2));
    const wgpa = Number((wTotal / creditsTotal).toFixed(2));

    await this.upsertProfile(userId, { uwgpa, wgpa });

    return { uwgpa, wgpa };
  }




}