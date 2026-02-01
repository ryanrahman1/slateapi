import { supabase } from "../config/supabase"

export async function getUser(userId: string) {
    const { data: user, error } = await supabase
        .schema('core')
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
    return user
}