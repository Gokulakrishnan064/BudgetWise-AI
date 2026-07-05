import React, { useState } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Database
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { EXPENSE_CATEGORIES } from '../../types';
import { Link } from 'react-router-dom';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

export function Dashboard() {
  const {
    income,
    expenses,
    budgets,
    savingsGoals,
    recommendations,
    isLoading,
    getCurrentMonthIncome,
    getCurrentMonthExpenses,
    getExpensesByCategory,
    getRecentTransactions,
    addIncome,
    addExpense,
    addBudget,
    addSavingsGoal,
    fetchAllData
  } = useFinancialData();

  const [seeding, setSeeding] = useState(false);

  const handleSeedDemoData = async () => {
    if (confirm("This will load sample incomes, expenses, budgets, and savings goals into your account for demonstration. Do you want to proceed?")) {
      setSeeding(true);
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const firstOfMonthStr = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        
        // 1. Seed Incomes
        await addIncome({
          amount: 95000,
          source: 'Primary Job Salary',
          income_type: 'salary',
          description: 'Monthly direct deposit salary',
          date: firstOfMonthStr,
          is_recurring: true
        });
        
        await addIncome({
          amount: 25000,
          source: 'UI Design Freelance',
          income_type: 'freelance',
          description: 'Client dashboard project payment',
          date: todayStr,
          is_recurring: false
        });

        // 2. Seed Expenses
        const expenseItems = [
          { amount: 25000, category: 'bills', description: 'Apartment Rent payment', date: firstOfMonthStr, is_recurring: true },
          { amount: 12000, category: 'food', description: 'Weekly groceries at supermarket', date: todayStr, is_recurring: false },
          { amount: 8000, category: 'food', description: 'Dining out & weekend cafes', date: todayStr, is_recurring: false },
          { amount: 15000, category: 'shopping', description: 'New clothes and tech accessories', date: todayStr, is_recurring: false },
          { amount: 5500, category: 'bills', description: 'WiFi, Electricity, Water bills', date: todayStr, is_recurring: true },
          { amount: 4000, category: 'transport', description: 'Monthly metro pass / car fuel', date: todayStr, is_recurring: false },
        ];

        for (const item of expenseItems) {
          await addExpense({
            amount: item.amount,
            category: item.category as any,
            description: item.description,
            date: item.date,
            is_recurring: item.is_recurring
          });
        }

        // 3. Seed Budgets
        const budgetCategories = [
          { category: 'food', amount: 15000 },
          { category: 'shopping', amount: 20000 },
          { category: 'bills', amount: 35000 },
          { category: 'transport', amount: 8000 },
        ];
        
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();

        for (const b of budgetCategories) {
          await addBudget({
            category: b.category as any,
            allocated_amount: b.amount,
            month,
            year
          });
        }

        // 4. Seed Savings Goals
        await addSavingsGoal({
          name: 'Emergency Fund',
          target_amount: 300000,
          category: 'emergency',
          target_date: format(subMonths(new Date(), -6), 'yyyy-MM-dd')
        });
        
        await addSavingsGoal({
          name: 'Europe Vacation',
          target_amount: 150000,
          category: 'vacation',
          target_date: format(subMonths(new Date(), -12), 'yyyy-MM-dd')
        });

        await fetchAllData();
        alert("Demo data successfully loaded!");
      } catch (err) {
        console.error("Error seeding data:", err);
        alert("Failed to load demo data. Please try again.");
      } finally {
        setSeeding(false);
      }
    }
  };

  const currentMonthIncome = getCurrentMonthIncome();
  const currentMonthExpenses = getCurrentMonthExpenses();
  const expensesByCategory = getExpensesByCategory();
  const recentTransactions = getRecentTransactions(5);
  const balance = currentMonthIncome - currentMonthExpenses;
  const savingsRate = currentMonthIncome > 0 ? (balance / currentMonthIncome) * 100 : 0;

  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || category,
    value: amount,
    color: EXPENSE_CATEGORIES.find((c) => c.value === category)?.color || '#6b7280',
  }));

  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const monthExpenses = expenses
      .filter((e) => {
        const expDate = new Date(e.date);
        return expDate >= monthStart && expDate <= monthEnd;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const monthIncome = income
      .filter((i) => {
        const incDate = new Date(i.date);
        return incDate >= monthStart && incDate <= monthEnd;
      })
      .reduce((sum, i) => sum + Number(i.amount), 0);

    return {
      month: format(date, 'MMM'),
      income: monthIncome,
      expenses: monthExpenses,
      savings: monthIncome - monthExpenses,
    };
  });

  const totalSavingsProgress = savingsGoals.reduce((sum, g) => sum + (g.current_amount / g.target_amount) * 100, 0) / (savingsGoals.length || 1);
  const financialHealthScore = Math.min(100, Math.round(
    (savingsRate * 0.4) +
    ((100 - (currentMonthExpenses / (currentMonthIncome || 1)) * 100) * 0.3) +
    (totalSavingsProgress * 0.3)
  ));

  const healthRating = financialHealthScore >= 80 ? 'Excellent' : financialHealthScore >= 60 ? 'Good' : financialHealthScore >= 40 ? 'Average' : 'Needs Improvement';
  const healthColor = financialHealthScore >= 80 ? 'success' : financialHealthScore >= 60 ? 'primary' : financialHealthScore >= 40 ? 'warning' : 'error';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Dashboard</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Your financial overview for {format(now, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDemoData}
            disabled={seeding}
            className="btn-secondary inline-flex items-center gap-2 py-2.5 px-4 text-sm"
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-primary-500" />
                Load Demo Data
              </>
            )}
          </button>
          <Link to="/budget" className="btn-primary inline-flex items-center gap-2 py-2.5 px-4 text-sm">
            <PiggyBank className="w-4 h-4" />
            Plan Budget with AI
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-500" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-success-500" />
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">Monthly Income</p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">
            {formatCurrency(currentMonthIncome)}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-error-100 dark:bg-error-900/30 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-error-500" />
            </div>
            <ArrowDownRight className="w-5 h-5 text-error-500" />
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">Monthly Expenses</p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">
            {formatCurrency(currentMonthExpenses)}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-success-500" />
            </div>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">Remaining Balance</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-success-500' : 'text-error-500'}`}>
            {formatCurrency(balance)}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-accent-500" />
            </div>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">Financial Health</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${
              healthColor === 'success' ? 'text-success-500' :
              healthColor === 'primary' ? 'text-primary-500' :
              healthColor === 'warning' ? 'text-warning-500' : 'text-error-500'
            }`}>
              {financialHealthScore}
            </p>
            <span className={`badge-${healthColor}`}>{healthRating}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="chart-container mb-6">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Savings Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last6Months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Savings']}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Expense Distribution</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-secondary-500">
                  No expenses this month
                </div>
              )}
            </div>

            <div className="chart-container">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Monthly Trends</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={last6Months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Bar dataKey="income" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-primary-500" />
                  Income
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-error-500" />
                  Expenses
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Savings Rate</h3>
            <div className="relative pt-4">
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-secondary-200 dark:text-secondary-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${Math.min(savingsRate, 100) * 3.52} 352`}
                      strokeLinecap="round"
                      className={savingsRate >= 20 ? 'text-success-500' : savingsRate >= 10 ? 'text-warning-500' : 'text-error-500'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary-900 dark:text-white">
                      {savingsRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center mt-4 text-secondary-600 dark:text-secondary-400">
                {savingsRate >= 20 ? 'Great savings habit!' :
                 savingsRate >= 10 ? 'Keep building your savings' :
                 'Try to save at least 10%'}
              </p>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50/50 dark:bg-secondary-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        t.type === 'income' ? 'bg-success-100 dark:bg-success-900/30' : 'bg-error-100 dark:bg-error-900/30'
                      }`}>
                        {t.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-success-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-error-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white text-sm">
                          {t.type === 'income' ? t.source : t.description || EXPENSE_CATEGORIES.find(c => c.value === (t as any).category)?.label}
                        </p>
                        <p className="text-xs text-secondary-500">{format(new Date(t.date), 'MMM dd')}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${t.type === 'income' ? 'text-success-500' : 'text-error-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-secondary-500 py-4">No recent transactions</p>
              )}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">AI Recommendations</h3>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-primary-50/50 dark:bg-primary-950/30">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">{r.title}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                      {r.recommendation_type.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
              <Link to="/ai-insights" className="btn-ghost w-full mt-4 text-center block">
                View All
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Budget Progress</h3>
        {budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => {
              const percentage = Math.min((budget.spent_amount / budget.allocated_amount) * 100, 100);
              const remaining = budget.allocated_amount - budget.spent_amount;
              const isOver = budget.spent_amount > budget.allocated_amount;

              return (
                <div key={budget.id} className="p-4 rounded-xl bg-secondary-50/50 dark:bg-secondary-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-secondary-900 dark:text-white capitalize">{budget.category}</span>
                    <span className={`text-sm ${isOver ? 'text-error-500' : 'text-secondary-500'}`}>
                      {formatCurrency(remaining)} left
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${isOver ? 'bg-gradient-to-r from-error-400 to-error-600' : ''}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-secondary-500">
                    <span>{formatCurrency(budget.spent_amount)} spent</span>
                    <span>{formatCurrency(budget.allocated_amount)} budget</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            <PiggyBank className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No budgets set for this month</p>
            <Link to="/budget" className="btn-primary inline-flex items-center gap-2 mt-4">
              Create Budget
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
