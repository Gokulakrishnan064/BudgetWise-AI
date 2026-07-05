import React, { useState } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Plus,
  TrendingDown,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Filter,
  X,
  ShoppingCart,
  Utensils,
  Car,
  Film,
  Receipt,
  GraduationCap,
  Heart,
  MoreHorizontal,
} from 'lucide-react';
import type { Expense, ExpenseCategory } from '../../types';
import { EXPENSE_CATEGORIES } from '../../types';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

const categoryIcons: Record<ExpenseCategory, React.ElementType> = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingCart,
  entertainment: Film,
  bills: Receipt,
  education: GraduationCap,
  healthcare: Heart,
  others: MoreHorizontal,
};

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
  onSave: (data: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => void;
}

function ExpenseModal({ isOpen, onClose, expense, onSave }: ExpenseModalProps) {
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'food');
  const [description, setDescription] = useState(expense?.description || '');
  const [date, setDate] = useState(expense?.date || format(new Date(), 'yyyy-MM-dd'));
  const [isRecurring, setIsRecurring] = useState(expense?.is_recurring || false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setDescription(expense.description || '');
      setDate(expense.date);
      setIsRecurring(expense.is_recurring);
    } else {
      setAmount('');
      setCategory('food');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setIsRecurring(false);
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await onSave({
      amount: parseFloat(amount),
      category,
      description: description || null,
      date,
      is_recurring: isRecurring,
    });

    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Amount ({CURRENCY_SYMBOL})</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="input-label">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat.value];
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                    }`}
                  >
                    <Icon
                      className="w-5 h-5 mx-auto mb-1"
                      style={{ color: isSelected ? cat.color : undefined }}
                    />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="input-label">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="Add notes..."
            />
          </div>

          <div>
            <label className="input-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-secondary-700 dark:text-secondary-300">
              This is a recurring expense
            </span>
          </label>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : expense ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ExpensesPage() {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    isLoading,
  } = useFinancialData();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const filteredExpenses = expenses
    .filter((e) => {
      const matchesSearch = e.description?.toLowerCase().includes(search.toLowerCase()) || false;
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSave = async (data: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
    } else {
      await addExpense(data);
    }
    setEditingExpense(null);
  };

  const handleEdit = (item: Expense) => {
    setEditingExpense(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(id);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thisMonthExpenses = expenses
    .filter((e) => {
      const date = new Date(e.date);
      return date >= monthStart && date <= monthEnd;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

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
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Expenses</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Track and categorize your spending
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setModalOpen(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error-100 dark:bg-error-900/30 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-error-500" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Expenses</p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">This Month</p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(thisMonthExpenses)}
              </p>
            </div>
          </div>
        </div>

        {EXPENSE_CATEGORIES.slice(0, 2).map((cat) => {
          const Icon = categoryIcons[cat.value];
          return (
            <div key={cat.value} className="stat-card">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div>
                  <p className="text-sm text-secondary-500">{cat.label}</p>
                  <p className="text-xl font-bold text-secondary-900 dark:text-white">
                    {formatCurrency(expensesByCategory[cat.value] || 0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card">
        <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-secondary-200/20 dark:border-secondary-700/30">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12"
              placeholder="Search expenses..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-secondary-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Amount</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Recurring</th>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((item) => {
                  const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
                  const Icon = categoryIcons[item.category];
                  return (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${categoryInfo?.color}20` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: categoryInfo?.color }} />
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900 dark:text-white">
                              {item.description || categoryInfo?.label}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: `${categoryInfo?.color}20`,
                            color: categoryInfo?.color,
                          }}
                        >
                          {categoryInfo?.label}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-error-500">
                        -{formatCurrency(Number(item.amount))}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-secondary-400" />
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="table-cell">
                        {item.is_recurring ? (
                          <span className="badge-warning">Yes</span>
                        ) : (
                          <span className="badge bg-secondary-100 dark:bg-secondary-800 text-secondary-600">No</span>
                        )}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-primary-500"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-error-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-8 text-secondary-500">
                    <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No expense records found</p>
                    <p className="text-sm">Add your first expense to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Spending by Category
        </h3>
        <div className="space-y-4">
          {EXPENSE_CATEGORIES.map((cat) => {
            const amount = expensesByCategory[cat.value] || 0;
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            return (
              <div key={cat.value}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-secondary-700 dark:text-secondary-300">{cat.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-secondary-900 dark:text-white">
                      {formatCurrency(amount)}
                    </span>
                    <span className="text-secondary-500 ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
        onSave={handleSave}
      />
    </div>
  );
}
