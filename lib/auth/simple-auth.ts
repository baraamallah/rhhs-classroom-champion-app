import { createClient } from '@/lib/supabase/client'

export async function verifyPassword(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const supabase = createClient()
    
    // Use Supabase RPC to call our custom authenticate function
    const { data, error } = await supabase.rpc('authenticate_user', {
      user_email: email,
      user_password: password
    })
    
    if (error) {
      console.error('Authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
    
    if (!data || !data.success) {
      return { success: false, error: data?.error || 'Invalid credentials' }
    }
    
    return { success: true, user: data.user }
  } catch (error) {
    console.error('Auth error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}
