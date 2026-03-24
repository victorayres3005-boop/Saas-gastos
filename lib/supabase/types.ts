export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          description: string
          value: number
          category: 'food' | 'saas' | 'transport' | 'leisure' | 'invest'
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          value: number
          category: 'food' | 'saas' | 'transport' | 'leisure' | 'invest'
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          value?: number
          category?: 'food' | 'saas' | 'transport' | 'leisure' | 'invest'
          date?: string
          created_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          limit_value: number
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          limit_value: number
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          limit_value?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
