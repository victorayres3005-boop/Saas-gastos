export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'meal_voucher' | 'credit' | 'debit' | 'cash' | 'checking'
          color: string
          balance: number
          bank: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'meal_voucher' | 'credit' | 'debit' | 'cash' | 'checking'
          color?: string
          balance?: number
          bank?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'meal_voucher' | 'credit' | 'debit' | 'cash' | 'checking'
          color?: string
          balance?: number
          bank?: string | null
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
          category: 'food' | 'saas' | 'transport' | 'leisure' | 'invest' | 'health' | 'education' | 'housing' | 'other' | 'salary' | 'freelance' | 'rent_income' | 'dividend' | 'other_income'
          date: string
          notes: string | null
          account_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          value: number
          category: 'food' | 'saas' | 'transport' | 'leisure' | 'invest' | 'health' | 'education' | 'housing' | 'other' | 'salary' | 'freelance' | 'rent_income' | 'dividend' | 'other_income'
          date?: string
          notes?: string | null | undefined
          account_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          value?: number
          category?: 'food' | 'saas' | 'transport' | 'leisure' | 'invest' | 'health' | 'education' | 'housing' | 'other' | 'salary' | 'freelance' | 'rent_income' | 'dividend' | 'other_income'
          date?: string
          notes?: string | null
          account_id?: string | null
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
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          target_value: number
          current_value: number
          deadline: string | null
          start_date: string | null
          color: string
          investment_type: 'none' | 'cdb_100' | 'cdb_110' | 'selic' | 'poupanca'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_value: number
          current_value?: number
          deadline?: string | null
          start_date?: string | null
          color?: string
          investment_type?: 'none' | 'cdb_100' | 'cdb_110' | 'selic' | 'poupanca'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_value?: number
          current_value?: number
          deadline?: string | null
          start_date?: string | null
          color?: string
          investment_type?: 'none' | 'cdb_100' | 'cdb_110' | 'selic' | 'poupanca'
          created_at?: string
        }
        Relationships: []
      }
      market_rates: {
        Row: {
          id: string
          value: number
          reference_date: string
          updated_at: string
        }
        Insert: {
          id: string
          value: number
          reference_date: string
          updated_at?: string
        }
        Update: {
          id?: string
          value?: number
          reference_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          description: string
          value: number
          category: string
          frequency: 'monthly' | 'weekly' | 'yearly'
          next_date: string
          active: boolean
          account_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          value: number
          category: string
          frequency: 'monthly' | 'weekly' | 'yearly'
          next_date: string
          active?: boolean
          account_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          value?: number
          category?: string
          frequency?: 'monthly' | 'weekly' | 'yearly'
          next_date?: string
          active?: boolean
          account_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
