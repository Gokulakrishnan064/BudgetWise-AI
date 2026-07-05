import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      income: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          source: string;
          income_type: string;
          description: string | null;
          date: string;
          is_recurring: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          amount: number;
          source: string;
          income_type?: string;
          description?: string | null;
          date?: string;
          is_recurring?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          source?: string;
          income_type?: string;
          description?: string | null;
          date?: string;
          is_recurring?: boolean;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: string;
          description: string | null;
          date: string;
          is_recurring: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          amount: number;
          category: string;
          description?: string | null;
          date?: string;
          is_recurring?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          description?: string | null;
          date?: string;
          is_recurring?: boolean;
          created_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          allocated_amount: number;
          spent_amount: number;
          month: number;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          category: string;
          allocated_amount: number;
          spent_amount?: number;
          month: number;
          year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          allocated_amount?: number;
          spent_amount?: number;
          month?: number;
          year?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          category: string;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          category?: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          category?: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_recommendations: {
        Row: {
          id: string;
          user_id: string;
          recommendation_type: string;
          title: string;
          content: Record<string, unknown>;
          priority: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          recommendation_type: string;
          title: string;
          content: Record<string, unknown>;
          priority?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recommendation_type?: string;
          title?: string;
          content?: Record<string, unknown>;
          priority?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      financial_reports: {
        Row: {
          id: string;
          user_id: string;
          report_type: string;
          month: number;
          year: number;
          data: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          report_type: string;
          month: number;
          year: number;
          data: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          report_type?: string;
          month?: number;
          year?: number;
          data?: Record<string, unknown>;
          created_at?: string;
        };
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          response: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          message: string;
          response: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          response?: string;
          created_at?: string;
        };
      };
    };
  };
};
