import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://derntgjgmpmzrfdxqjas.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcm50Z2pnbXBtenJmZHhxamFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTY0NTgsImV4cCI6MjA4ODIzMjQ1OH0.ktdnB6mmIZ2ueG5uQ6BdE-q5wrPgSdY7MQwgVldsUd8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          avatar_url: string | null
          church: string | null
          city: string | null
          bio: string | null
          age: number | null
          xp: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      sessions: {
        Row: {
          id: string
          day: number
          title: string
          speaker: string | null
          type: 'plenaria' | 'louvor' | 'oficina'
          start_time: string
          end_time: string
          description: string | null
          created_at: string
        }
      }
      missions: {
        Row: {
          id: string
          title: string
          description: string | null
          xp_reward: number
          icon: string
          day: number
          created_at: string
        }
      }
      user_missions: {
        Row: {
          id: string
          user_id: string
          mission_id: string
          completed_at: string
        }
      }
      feed_posts: {
        Row: {
          id: string
          user_id: string
          type: 'comment' | 'prayer' | 'announcement'
          content: string
          likes_count: number
          created_at: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          emoji: string
          created_at: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          session_id: string
          content: string
          updated_at: string
          created_at: string
        }
      }
      products: {
        Row: {
          id: string
          category: 'shop' | 'food'
          name: string
          price: number
          emoji: string
          description: string | null
          venue: string | null
          created_at: string
        }
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
      }
    }
  }
}
