import React, { useState, useEffect } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  PiggyBank,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../types';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

interface BudgetCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface BudgetPlan {
  categories: BudgetCategory[];
  savings_target: number;
  emergency_fund: number;
  total_income: number;
  explanation: string;
}

export function BudgetPage() {
  const { income, expenses, budgets, addBudget, updateBudget, deleteBudget, isLoading } = useFinancialData();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const totalMonthlyIncome = income
      .filter((i) => {
        const date = new Date(i.date);
        return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
      })
      .reduce((sum, i) => sum + Number(i.amount), 0);

    if (totalMonthlyIncome > 0) {
      setMonthlyIncome(totalMonthlyIncome.toString());
      setSavingsTarget(Math.round(totalMonthlyIncome * 0.2).toString());
    }
  }, [income]);

  const generateBudget = async () => {
    setError('');
    setGenerating(true);

    try {
      const currentMonthExpenses: Record<string, number> = {};
      expenses
        .filter((e) => {
          const date = new Date(e.date);
          return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
        })
        .forEach((e) => {
          currentMonthExpenses[e.category] = (currentMonthExpenses[e.category] || 0) + Number(e.amount);
        });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent?action=budget-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            income: parseFloat(monthlyIncome),
            savingsTarget: parseFloat(savingsTarget),
            currentExpenses: currentMonthExpenses,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate budget');

      const data = await response.json();
      setBudgetPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate budget');
    } finally {
      setGenerating(false);
    }
  };

  const saveBudget = async () => {
    if (!budgetPlan) return;
    setSaving(true);

    try {
      for (const cat of budgetPlan.categories) {
        if (cat.category === 'savings' || cat.category === 'emergency') continue;

        const existing = budgets.find(
          (b) => b.category === cat.category && b.month === currentMonth && b.year === currentYear
        );

        if (existing) {
          await updateBudget(existing.id, { allocated_amount: cat.amount });
        } else {
          await addBudget({
            category: cat.category,
            allocated_amount: cat.amount,
            month: currentMonth,
            year: currentYear,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Budget Planning</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            AI-powered budget recommendations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
            Generate AI Budget
          </h3>

          <div className="space-y-4">
            <div>
              <label className="input-label">Monthly Income ({CURRENCY_SYMBOL})</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="input-field"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="input-label">Savings Target ({CURRENCY_SYMBOL})</label>
              <input
                type="number"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                className="input-field"
                placeholder="15000"
              />
              <p className="text-xs text-secondary-500 mt-1">
                Recommended: 20% of income
              </p>
            </div>

            <button
              onClick={generateBudget}
              disabled={generating || !monthlyIncome || !savingsTarget}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Generate AI Budget
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        {budgetPlan && (
          <div className="lg:col-span-2">
            <div className="glass-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                  Your AI Budget Plan
                </h3>
                <button
                  onClick={saveBudget}
                  disabled={saving}
                  className="btn-secondary flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Apply Budget
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {budgetPlan.categories.map((cat) => {
                  const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.value === cat.category);
                  return (
                    <div
                      key={cat.category}
                      className="p-4 rounded-xl bg-secondary-50/50 dark:bg-secondary-800/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-secondary-900 dark:text-white capitalize">
                          {cat.category}
                        </span>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: categoryInfo ? `${categoryInfo.color}20` : '#6b728020',
                            color: categoryInfo?.color || '#6b7280',
                          }}
                        >
                          {cat.percentage}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                        {formatCurrency(cat.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
                <div className="flex items-start gap-3">
                  <PiggyBank className="w-5 h-5 text-success-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-success-700 dark:text-success-400">
                      Savings Target: {formatCurrency(budgetPlan.savings_target)}
                    </p>
                    <p className="text-sm text-success-600 dark:text-success-500">
                      Emergency Fund Buffer: {formatCurrency(budgetPlan.emergency_fund)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-primary-700 dark:text-primary-400 mb-2">
                      AI Explanation
                    </p>
                    <p className="text-sm text-primary-600 dark:text-primary-300">
                      {budgetPlan.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Current Budget ({format(new Date(), 'MMMM yyyy')})
        </h3>
        {budgets.length > 0 ? (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.value === budget.category);
              const percentage = Math.min((budget.spent_amount / budget.allocated_amount) * 100, 100);
              const remaining = budget.allocated_amount - budget.spent_amount;

              return (
                <div key={budget.id} className="p-4 rounded-xl bg-secondary-50/50 dark:bg-secondary-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-secondary-900 dark:text-white capitalize">
                      {budget.category}
                    </span>
                    <span className={remaining < 0 ? 'text-error-500' : 'text-secondary-500'}>
                      {formatCurrency(remaining)} remaining
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${percentage > 90 ? 'bg-error-500' : percentage > 75 ? 'bg-warning-500' : 'bg-success-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-secondary-500">
                    <span>Spent: {formatCurrency(budget.spent_amount)}</span>
                    <span>Budget: {formatCurrency(budget.allocated_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            <PiggyBank className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No budgets set for this month</p>
            <p className="text-sm">Generate an AI budget above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
