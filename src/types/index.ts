export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type IncomeType = 'salary' | 'freelance' | 'investment' | 'business' | 'other';

export type Income = {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  income_type: IncomeType;
  description: string | null;
  date: string;
  is_recurring: boolean;
  created_at: string;
};

export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'education' | 'healthcare' | 'others';

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  date: string;
  is_recurring: boolean;
  created_at: string;
};

export type BudgetCategory = ExpenseCategory | 'savings' | 'emergency';

export type Budget = {
  id: string;
  user_id: string;
  category: BudgetCategory;
  allocated_amount: number;
  spent_amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
};

export type SavingsGoalCategory = 'emergency' | 'vacation' | 'major_purchase' | 'education' | 'retirement' | 'other';

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  category: SavingsGoalCategory;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type RecommendationType = 'budget_plan' | 'expense_analysis' | 'savings_advice' | 'prediction' | 'health_score';

export type Priority = 'low' | 'medium' | 'high';

export type AIRecommendation = {
  id: string;
  user_id: string;
  recommendation_type: RecommendationType;
  title: string;
  content: Record<string, unknown>;
  priority: Priority;
  is_read: boolean;
  created_at: string;
};

export type ReportType = 'monthly' | 'expense_summary' | 'savings' | 'ai_recommendations';

export type FinancialReport = {
  id: string;
  user_id: string;
  report_type: ReportType;
  month: number;
  year: number;
  data: Record<string, unknown>;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  response: string;
  created_at: string;
};

export type FinancialHealthScore = {
  score: number;
  rating: 'excellent' | 'good' | 'average' | 'needs_improvement';
  metrics: {
    savings_ratio: number;
    expense_ratio: number;
    budget_adherence: number;
    spending_consistency: number;
  };
};

export type BudgetPlan = {
  categories: {
    category: BudgetCategory;
    amount: number;
    percentage: number;
  }[];
  savings_target: number;
  emergency_fund: number;
  total_income: number;
  explanation: string;
};

export type ExpenseAnalysis = {
  total_spent: number;
  category_breakdown: { category: ExpenseCategory; amount: number; percentage: number }[];
  highest_spending_category: ExpenseCategory;
  weekly_trend: { week: number; amount: number }[];
  monthly_trend: { month: string; amount: number }[];
  insights: string[];
  overspending_alerts: string[];
};

export type SavingsAdvice = {
  recommended_savings_target: number;
  investment_recommendations: string[];
  emergency_fund_plan: {
    target_amount: number;
    monthly_contribution: number;
    months_to_reach: number;
  };
  cost_cutting_suggestions: string[];
};

export type BudgetPrediction = {
  predicted_end_of_month_expenses: number;
  will_exceed_budget: boolean;
  excess_amount: number;
  future_savings_estimate: number;
  confidence_level: number;
};

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { value: 'food', label: 'Food', icon: 'Utensils', color: '#ef4444' },
  { value: 'transport', label: 'Transport', icon: 'Car', color: '#f97316' },
  { value: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#eab308' },
  { value: 'entertainment', label: 'Entertainment', icon: 'Film', color: '#22c55e' },
  { value: 'bills', label: 'Bills', icon: 'Receipt', color: '#3b82f6' },
  { value: 'education', label: 'Education', icon: 'GraduationCap', color: '#8b5cf6' },
  { value: 'healthcare', label: 'Healthcare', icon: 'Heart', color: '#ec4899' },
  { value: 'others', label: 'Others', icon: 'MoreHorizontal', color: '#6b7280' },
];

export const INCOME_TYPES: { value: IncomeType; label: string }[] = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investment' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
];

export const SAVINGS_GOAL_CATEGORIES: { value: SavingsGoalCategory; label: string }[] = [
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'major_purchase', label: 'Major Purchase' },
  { value: 'education', label: 'Education' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'other', label: 'Other' },
];
