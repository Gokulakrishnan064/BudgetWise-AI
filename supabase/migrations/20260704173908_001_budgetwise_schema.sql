/*
# BudgetWise AI - Complete Database Schema

1. New Tables
- `profiles` - User profile information (linked to auth.users)
  - id (uuid, primary key, references auth.users)
  - full_name (text)
  - avatar_url (text)
  - currency (text, default 'INR')
  - created_at (timestamp)
  - updated_at (timestamp)

- `income` - User income records
  - id (uuid, primary key)
  - user_id (uuid, references auth.users)
  - amount (decimal, not null)
  - source (text, not null)
  - income_type (text: salary, freelance, investment, business, other)
  - description (text)
  - date (date)
  - is_recurring (boolean, default false)
  - created_at (timestamp)

- `expenses` - User expense records
  - id (uuid, primary key)
  - user_id (uuid, references auth.users)
  - amount (decimal, not null)
  - category (text: food, transport, shopping, entertainment, bills, education, healthcare, others)
  - description (text)
  - date (date)
  - is_recurring (boolean, default false)
  - created_at (timestamp)

- `budgets` - User budget allocations
  - id (uuid, primary key)
  - user_id (uuid, references auth.users)
  - category (text)
  - allocated_amount (decimal, not null)
  - spent_amount (decimal, default 0)
  - month (integer, 1-12)
  - year (integer)
  - created_at (timestamp)
  - updated_at (timestamp)

- `savings_goals` - User savings targets
  - id (uuid, primary key)
  - user_id (uuid, references auth.users)
  - name (text, not null)
  - target_amount (decimal, not null)
  - current_amount (decimal, default 0)
  - target_date (date)
  - category (text: emergency, vacation, major_purchase, education, retirement, other)
  - is_completed (boolean, default false)
  - created_at (timestamp)
  - updated_at (timestamp)

- `ai_recommendations` - AI-generated financial recommendations
  - id (uuid, primary key)
  - user_id (uuid, references auth.users)
  - recommendation_type (text: budget_plan, expense_analysis, savings_advice, prediction, health_score)
  - title (text)
  - content (jsonb)
  - priority (text: low, medium, high)
  - is_read (boolean, default false)
  - created_at (timestamp)

- `financial_reports` - Generated financial reports
  - id (uuid, primary key)
  - user_id (uuid, references auth.users)
  - report_type (text: monthly, expense_summary, savings, ai_recommendations)
  - month (integer)
  - year (integer)
  - data (jsonb)
  - created_at (timestamp)

- `chat_history` - AI chatbot conversation history
  - id (uuid, primary key)
  - user_id (uuid, references auth.users)
  - message (text)
  - response (text)
  - created_at (timestamp)

2. Security
- Enable RLS on all tables.
- Owner-scoped CRUD policies for authenticated users.
- All user_id columns default to auth.uid() for automatic ownership.

3. Indexes
- Index on user_id for all tables for query performance.
- Index on date columns for time-based queries.
- Index on category for expense/budget queries.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Income table
CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  source text NOT NULL,
  income_type text NOT NULL DEFAULT 'other' CHECK (income_type IN ('salary', 'freelance', 'investment', 'business', 'other')),
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_income" ON income;
CREATE POLICY "select_own_income" ON income FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_income" ON income;
CREATE POLICY "insert_own_income" ON income FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_income" ON income;
CREATE POLICY "update_own_income" ON income FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_income" ON income;
CREATE POLICY "delete_own_income" ON income FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  category text NOT NULL CHECK (category IN ('food', 'transport', 'shopping', 'entertainment', 'bills', 'education', 'healthcare', 'others')),
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('food', 'transport', 'shopping', 'entertainment', 'bills', 'education', 'healthcare', 'others', 'savings', 'emergency')),
  allocated_amount decimal(12,2) NOT NULL,
  spent_amount decimal(12,2) NOT NULL DEFAULT 0,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, month, year)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_budgets" ON budgets;
CREATE POLICY "select_own_budgets" ON budgets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_budgets" ON budgets;
CREATE POLICY "insert_own_budgets" ON budgets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_budgets" ON budgets;
CREATE POLICY "update_own_budgets" ON budgets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_budgets" ON budgets;
CREATE POLICY "delete_own_budgets" ON budgets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount decimal(12,2) NOT NULL,
  current_amount decimal(12,2) NOT NULL DEFAULT 0,
  target_date date,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('emergency', 'vacation', 'major_purchase', 'education', 'retirement', 'other')),
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_savings_goals" ON savings_goals;
CREATE POLICY "select_own_savings_goals" ON savings_goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_savings_goals" ON savings_goals;
CREATE POLICY "insert_own_savings_goals" ON savings_goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_savings_goals" ON savings_goals;
CREATE POLICY "update_own_savings_goals" ON savings_goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_savings_goals" ON savings_goals;
CREATE POLICY "delete_own_savings_goals" ON savings_goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AI recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('budget_plan', 'expense_analysis', 'savings_advice', 'prediction', 'health_score')),
  title text NOT NULL,
  content jsonb NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "select_own_ai_recommendations" ON ai_recommendations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "insert_own_ai_recommendations" ON ai_recommendations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "update_own_ai_recommendations" ON ai_recommendations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "delete_own_ai_recommendations" ON ai_recommendations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Financial reports table
CREATE TABLE IF NOT EXISTS financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('monthly', 'expense_summary', 'savings', 'ai_recommendations')),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_financial_reports" ON financial_reports;
CREATE POLICY "select_own_financial_reports" ON financial_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_financial_reports" ON financial_reports;
CREATE POLICY "insert_own_financial_reports" ON financial_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_financial_reports" ON financial_reports;
CREATE POLICY "delete_own_financial_reports" ON financial_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat_history" ON chat_history;
CREATE POLICY "select_own_chat_history" ON chat_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat_history" ON chat_history;
CREATE POLICY "insert_own_chat_history" ON chat_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat_history" ON chat_history;
CREATE POLICY "delete_own_chat_history" ON chat_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_user_id ON financial_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

-- Trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_budgets_updated_at ON budgets;
CREATE TRIGGER handle_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_savings_goals_updated_at ON savings_goals;
CREATE TRIGGER handle_savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();