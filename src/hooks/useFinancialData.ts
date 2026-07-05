import { useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { useAuth } from './useAuth';
import type { Income, Expense, Budget, SavingsGoal, AIRecommendation } from '../types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function useFinancialData() {
  const { user } = useAuth();
  const {
    income,
    expenses,
    budgets,
    savingsGoals,
    recommendations,
    isLoading,
    setIncome,
    setExpenses,
    setBudgets,
    setSavingsGoals,
    setRecommendations,
    setIsLoading,
  } = useStore();

  const fetchIncome = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('income').select('*').order('date', { ascending: false });
    if (!error && data) setIncome(data);
  }, [user, setIncome]);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (!error && data) setExpenses(data);
  }, [user, setExpenses]);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear);
    if (!error && data) setBudgets(data);
  }, [user, setBudgets]);

  const fetchSavingsGoals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: false });
    if (!error && data) setSavingsGoals(data);
  }, [user, setSavingsGoals]);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('ai_recommendations').select('*').order('created_at', { ascending: false }).limit(10);
    if (!error && data) setRecommendations(data);
  }, [user, setRecommendations]);

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    await Promise.all([fetchIncome(), fetchExpenses(), fetchBudgets(), fetchSavingsGoals(), fetchRecommendations()]);
    setIsLoading(false);
  }, [user, setIsLoading, fetchIncome, fetchExpenses, fetchBudgets, fetchSavingsGoals, fetchRecommendations]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  const addIncome = useCallback(
    async (incomeData: Omit<Income, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase.from('income').insert(incomeData).select().single();
      if (!error && data) {
        setIncome([data, ...income]);
      }
      return { data, error };
    },
    [income, setIncome]
  );

  const updateIncome = useCallback(
    async (id: string, incomeData: Partial<Income>) => {
      const { data, error } = await supabase.from('income').update(incomeData).eq('id', id).select().single();
      if (!error && data) {
        setIncome(income.map((i) => (i.id === id ? data : i)));
      }
      return { data, error };
    },
    [income, setIncome]
  );

  const deleteIncome = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('income').delete().eq('id', id);
      if (!error) {
        setIncome(income.filter((i) => i.id !== id));
      }
      return { error };
    },
    [income, setIncome]
  );

  const addExpense = useCallback(
    async (expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase.from('expenses').insert(expenseData).select().single();
      if (!error && data) {
        setExpenses([data, ...expenses]);
      }
      return { data, error };
    },
    [expenses, setExpenses]
  );

  const updateExpense = useCallback(
    async (id: string, expenseData: Partial<Expense>) => {
      const { data, error } = await supabase.from('expenses').update(expenseData).eq('id', id).select().single();
      if (!error && data) {
        setExpenses(expenses.map((e) => (e.id === id ? data : e)));
      }
      return { data, error };
    },
    [expenses, setExpenses]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) {
        setExpenses(expenses.filter((e) => e.id !== id));
      }
      return { error };
    },
    [expenses, setExpenses]
  );

  const addBudget = useCallback(
    async (budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent_amount'>) => {
      const { data, error } = await supabase.from('budgets').insert(budgetData).select().single();
      if (!error && data) {
        setBudgets([...budgets, data]);
      }
      return { data, error };
    },
    [budgets, setBudgets]
  );

  const updateBudget = useCallback(
    async (id: string, budgetData: Partial<Budget>) => {
      const { data, error } = await supabase.from('budgets').update(budgetData).eq('id', id).select().single();
      if (!error && data) {
        setBudgets(budgets.map((b) => (b.id === id ? data : b)));
      }
      return { data, error };
    },
    [budgets, setBudgets]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (!error) {
        setBudgets(budgets.filter((b) => b.id !== id));
      }
      return { error };
    },
    [budgets, setBudgets]
  );

  const addSavingsGoal = useCallback(
    async (goalData: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_amount' | 'is_completed'>) => {
      const { data, error } = await supabase.from('savings_goals').insert(goalData).select().single();
      if (!error && data) {
        setSavingsGoals([data, ...savingsGoals]);
      }
      return { data, error };
    },
    [savingsGoals, setSavingsGoals]
  );

  const updateSavingsGoal = useCallback(
    async (id: string, goalData: Partial<SavingsGoal>) => {
      const { data, error } = await supabase.from('savings_goals').update(goalData).eq('id', id).select().single();
      if (!error && data) {
        setSavingsGoals(savingsGoals.map((g) => (g.id === id ? data : g)));
      }
      return { data, error };
    },
    [savingsGoals, setSavingsGoals]
  );

  const deleteSavingsGoal = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (!error) {
        setSavingsGoals(savingsGoals.filter((g) => g.id !== id));
      }
      return { error };
    },
    [savingsGoals, setSavingsGoals]
  );

  const markRecommendationAsRead = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('ai_recommendations').update({ is_read: true }).eq('id', id);
      if (!error) {
        setRecommendations(recommendations.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
      }
      return { error };
    },
    [recommendations, setRecommendations]
  );

  const getCurrentMonthIncome = useCallback(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    return income
      .filter((i) => {
        const date = new Date(i.date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, i) => sum + Number(i.amount), 0);
  }, [income]);

  const getCurrentMonthExpenses = useCallback(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    return expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const getExpensesByCategory = useCallback(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const categoryTotals: Record<string, number> = {};

    expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date >= monthStart && date <= monthEnd;
      })
      .forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });

    return categoryTotals;
  }, [expenses]);

  const getRecentTransactions = useCallback((limit = 10) => {
    const allTransactions = [
      ...income.map((i) => ({ ...i, type: 'income' as const })),
      ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allTransactions.slice(0, limit);
  }, [income, expenses]);

  const budgetsWithSpentAmount = useMemo(() => {
    return budgets.map((budget) => {
      const categoryExpenses = expenses.filter((e) => {
        // Safe split or parse of the date string to prevent timezone offset shifts
        const parts = e.date.split('-');
        let expMonth = 0;
        let expYear = 0;
        if (parts.length >= 2) {
          expYear = parseInt(parts[0], 10);
          expMonth = parseInt(parts[1], 10);
        } else {
          const expDate = new Date(e.date);
          expMonth = expDate.getMonth() + 1;
          expYear = expDate.getFullYear();
        }
        return (
          e.category === budget.category &&
          expMonth === budget.month &&
          expYear === budget.year
        );
      });
      const spent = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        ...budget,
        spent_amount: spent,
      };
    });
  }, [budgets, expenses]);

  return {
    income,
    expenses,
    budgets: budgetsWithSpentAmount,
    savingsGoals,
    recommendations,
    isLoading,
    fetchAllData,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addBudget,
    updateBudget,
    deleteBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    markRecommendationAsRead,
    getCurrentMonthIncome,
    getCurrentMonthExpenses,
    getExpensesByCategory,
    getRecentTransactions,
  };
}
