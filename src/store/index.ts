import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Income, Expense, Budget, SavingsGoal, AIRecommendation, ChatMessage } from '../types';

type ThemeMode = 'light' | 'dark';

interface AppState {
  theme: ThemeMode;
  profile: Profile | null;
  income: Income[];
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recommendations: AIRecommendation[];
  chatHistory: ChatMessage[];
  isLoading: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setProfile: (profile: Profile | null) => void;
  setIncome: (income: Income[]) => void;
  addIncome: (income: Income) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  setSavingsGoals: (goals: SavingsGoal[]) => void;
  addSavingsGoal: (goal: SavingsGoal) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  setRecommendations: (recommendations: AIRecommendation[]) => void;
  addRecommendation: (recommendation: AIRecommendation) => void;
  markRecommendationAsRead: (id: string) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  theme: 'light' as ThemeMode,
  profile: null,
  income: [],
  expenses: [],
  budgets: [],
  savingsGoals: [],
  recommendations: [],
  chatHistory: [],
  isLoading: false,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setProfile: (profile) => set({ profile }),
      setIncome: (income) => set({ income }),
      addIncome: (income) => set((state) => ({ income: [...state.income, income] })),
      updateIncome: (id, income) =>
        set((state) => ({
          income: state.income.map((i) => (i.id === id ? { ...i, ...income } : i)),
        })),
      deleteIncome: (id) => set((state) => ({ income: state.income.filter((i) => i.id !== id) })),
      setExpenses: (expenses) => set({ expenses }),
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      updateExpense: (id, expense) =>
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...expense } : e)),
        })),
      deleteExpense: (id) => set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),
      setBudgets: (budgets) => set({ budgets }),
      addBudget: (budget) => set((state) => ({ budgets: [...state.budgets, budget] })),
      updateBudget: (id, budget) =>
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...budget } : b)),
        })),
      deleteBudget: (id) => set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),
      setSavingsGoals: (goals) => set({ savingsGoals: goals }),
      addSavingsGoal: (goal) => set((state) => ({ savingsGoals: [...state.savingsGoals, goal] })),
      updateSavingsGoal: (id, goal) =>
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) => (g.id === id ? { ...g, ...goal } : g)),
        })),
      deleteSavingsGoal: (id) => set((state) => ({ savingsGoals: state.savingsGoals.filter((g) => g.id !== id) })),
      setRecommendations: (recommendations) => set({ recommendations }),
      addRecommendation: (recommendation) => set((state) => ({ recommendations: [...state.recommendations, recommendation] })),
      markRecommendationAsRead: (id) =>
        set((state) => ({
          recommendations: state.recommendations.map((r) => (r.id === id ? { ...r, is_read: true } : r)),
        })),
      setChatHistory: (history) => set({ chatHistory: history }),
      addChatMessage: (message) => set((state) => ({ chatHistory: [...state.chatHistory, message] })),
      clearChatHistory: () => set({ chatHistory: [] }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      reset: () => set(initialState),
    }),
    {
      name: 'budgetwise-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
