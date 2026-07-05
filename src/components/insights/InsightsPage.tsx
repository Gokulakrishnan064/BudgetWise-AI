import React, { useState, useEffect } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Lightbulb,
  BarChart3,
  LineChart,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

export function InsightsPage() {
  const { income, expenses, budgets, savingsGoals, isLoading } = useFinancialData();
  const [loading, setLoading] = useState(false);
  const [expenseAnalysis, setExpenseAnalysis] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [savingsAdvice, setSavingsAdvice] = useState<any>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const dayOfMonth = new Date().getDate();
  const totalDaysInMonth = getDaysInMonth(new Date());

  useEffect(() => {
    if (income.length > 0 || expenses.length > 0) {
      generateInsights();
    }
  }, [income, expenses]);

  const generateInsights = async () => {
    setLoading(true);

    try {
      const currentMonthExpenses: Record<string, number> = {};
      const lastMonthExpenses: Record<string, number> = {};

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

      expenses.forEach((e) => {
        const date = new Date(e.date);
        if (date >= currentMonthStart && date <= currentMonthEnd) {
          currentMonthExpenses[e.category] = (currentMonthExpenses[e.category] || 0) + Number(e.amount);
        }
        if (date >= lastMonthStart && date <= lastMonthEnd) {
          lastMonthExpenses[e.category] = (lastMonthExpenses[e.category] || 0) + Number(e.amount);
        }
      });

      const totalIncome = income
        .filter((i) => {
          const date = new Date(i.date);
          return date >= currentMonthStart && date <= currentMonthEnd;
        })
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const totalExpenses = Object.values(currentMonthExpenses).reduce((a, b) => a + b, 0);
      const savings = totalIncome - totalExpenses;

      const budgetAdherence = budgets.length > 0
        ? budgets.reduce((sum, b) => {
            const usedPercent = (b.spent_amount / b.allocated_amount) * 100;
            return sum + Math.min(usedPercent, 100);
          }, 0) / budgets.length
        : 50;

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };

      const [analysisRes, healthRes, predictionRes, savingsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent?action=expense-analysis`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            currentMonthExpenses,
            lastMonthExpenses,
            totalIncome,
          }),
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent?action=financial-health`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            totalIncome,
            totalExpenses,
            savingsAmount: savings,
            budgetAdherence,
          }),
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent?action=budget-prediction`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            income: totalIncome,
            expensesSoFar: totalExpenses,
            dayOfMonth,
            totalDaysInMonth,
            currentBudget: totalIncome * 0.8,
          }),
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent?action=savings-advice`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            income: totalIncome,
            currentSavings: savings,
            goals: savingsGoals.map((g) => ({
              name: g.name,
              target: g.target_amount,
              current: g.current_amount,
            })),
          }),
        }),
      ]);

      setExpenseAnalysis(await analysisRes.json());
      setHealthScore(await healthRes.json());
      setPrediction(await predictionRes.json());
      setSavingsAdvice(await savingsRes.json());
    } catch (err) {
      console.error('Failed to generate insights:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">AI Insights</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Smart financial analysis and recommendations
          </p>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="btn-secondary inline-flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          Refresh Insights
        </button>
      </div>

      {healthScore && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Financial Health Score
              </h3>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="none"
                    className="text-secondary-200 dark:text-secondary-700"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="none"
                    strokeDasharray={`${healthScore.score * 4.4} 440`}
                    strokeLinecap="round"
                    className={
                      healthScore.score >= 80 ? 'text-success-500' :
                      healthScore.score >= 60 ? 'text-primary-500' :
                      healthScore.score >= 40 ? 'text-warning-500' : 'text-error-500'
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-secondary-900 dark:text-white">
                    {healthScore.score}
                  </span>
                  <span className="text-sm text-secondary-500 capitalize">
                    {healthScore.rating}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(healthScore.metrics).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-secondary-50/50 dark:bg-secondary-800/50">
                  <p className="text-xs text-secondary-500 capitalize mb-1">
                    {key.replace('_', ' ')}
                  </p>
                  <p className="text-lg font-semibold text-secondary-900 dark:text-white">
                    {value}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-warning-500" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Budget Prediction
              </h3>
            </div>

            {prediction && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary-50/50 dark:bg-secondary-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary-600 dark:text-secondary-400">
                      Predicted End-of-Month Expenses
                    </span>
                    <span className="text-xl font-bold text-secondary-900 dark:text-white">
                      {formatCurrency(prediction.predicted_end_of_month_expenses)}
                    </span>
                  </div>
                </div>

                {prediction.will_exceed_budget ? (
                  <div className="p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-error-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-error-700 dark:text-error-400">
                          Budget Alert
                        </p>
                        <p className="text-sm text-error-600 dark:text-error-300">
                          You may exceed your budget by {formatCurrency(prediction.excess_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-success-700 dark:text-success-400">
                          On Track
                        </p>
                        <p className="text-sm text-success-600 dark:text-success-300">
                          Expected savings: {formatCurrency(prediction.future_savings_estimate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-secondary-500">
                  <span>Confidence Level</span>
                  <span className="font-semibold">{prediction.confidence_level}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {expenseAnalysis && (
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-accent-500" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              Expense Analysis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-secondary-500 mb-2">Total Spent This Month</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(expenseAnalysis.total_spent)}
              </p>
              <p className="text-sm text-secondary-500 mt-1">
                Highest category: <span className="font-semibold capitalize">{expenseAnalysis.highest_spending_category}</span>
              </p>
            </div>

            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseAnalysis.category_breakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ category }) => category}
                  >
                    {expenseAnalysis.category_breakdown.map((entry: any, index: number) => (
                      <Cell key={index} fill={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'][index % 8]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {expenseAnalysis.insights.length > 0 && (
            <div className="space-y-2 mb-4">
              {expenseAnalysis.insights.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary-50/50 dark:bg-primary-950/30">
                  <Lightbulb className="w-4 h-4 text-primary-500 mt-0.5" />
                  <p className="text-sm text-primary-700 dark:text-primary-300">{insight}</p>
                </div>
              ))}
            </div>
          )}

          {expenseAnalysis.overspending_alerts.length > 0 && (
            <div className="space-y-2">
              {expenseAnalysis.overspending_alerts.map((alert: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-error-50/50 dark:bg-error-900/20">
                  <AlertTriangle className="w-4 h-4 text-error-500 mt-0.5" />
                  <p className="text-sm text-error-700 dark:text-error-300">{alert}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {savingsAdvice && (
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-success-500" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              Savings Advice
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-success-50/50 dark:bg-success-900/20">
                <p className="text-sm text-secondary-500">Recommended Savings Target</p>
                <p className="text-2xl font-bold text-success-600">
                  {formatCurrency(savingsAdvice.recommended_savings_target)}/month
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary-50/50 dark:bg-secondary-800/50">
                <p className="text-sm text-secondary-500 mb-2">Emergency Fund Plan</p>
                <div className="space-y-1">
                  <p>Target: <span className="font-semibold">{formatCurrency(savingsAdvice.emergency_fund_plan.target_amount)}</span></p>
                  <p>Monthly: <span className="font-semibold">{formatCurrency(savingsAdvice.emergency_fund_plan.monthly_contribution)}</span></p>
                  <p>Duration: <span className="font-semibold">{savingsAdvice.emergency_fund_plan.months_to_reach} months</span></p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-secondary-900 dark:text-white mb-3">Cost-Cutting Suggestions</h4>
              <ul className="space-y-2">
                {savingsAdvice.cost_cutting_suggestions.map((suggestion: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                    <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold text-secondary-900 dark:text-white mt-6 mb-3">Investment Recommendations</h4>
              <ul className="space-y-2">
                {savingsAdvice.investment_recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                    <TrendingUp className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
