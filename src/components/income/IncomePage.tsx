import React, { useState } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import { format } from 'date-fns';
import {
  Plus,
  TrendingUp,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Filter,
  X,
  RefreshCcw,
} from 'lucide-react';
import type { Income, IncomeType } from '../../types';
import { INCOME_TYPES } from '../../types';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income?: Income | null;
  onSave: (data: Omit<Income, 'id' | 'user_id' | 'created_at'>) => void;
}

function IncomeModal({ isOpen, onClose, income, onSave }: IncomeModalProps) {
  const [amount, setAmount] = useState(income?.amount?.toString() || '');
  const [source, setSource] = useState(income?.source || '');
  const [incomeType, setIncomeType] = useState<IncomeType>(income?.income_type || 'salary');
  const [description, setDescription] = useState(income?.description || '');
  const [date, setDate] = useState(income?.date || format(new Date(), 'yyyy-MM-dd'));
  const [isRecurring, setIsRecurring] = useState(income?.is_recurring || false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (income) {
      setAmount(income.amount.toString());
      setSource(income.source);
      setIncomeType(income.income_type);
      setDescription(income.description || '');
      setDate(income.date);
      setIsRecurring(income.is_recurring);
    } else {
      setAmount('');
      setSource('');
      setIncomeType('salary');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setIsRecurring(false);
    }
  }, [income, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await onSave({
      amount: parseFloat(amount),
      source,
      income_type: incomeType,
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
            {income ? 'Edit Income' : 'Add Income'}
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
            <label className="input-label">Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="input-field"
              placeholder="e.g., Salary, Freelance Work"
              required
            />
          </div>

          <div>
            <label className="input-label">Income Type</label>
            <select
              value={incomeType}
              onChange={(e) => setIncomeType(e.target.value as IncomeType)}
              className="input-field"
            >
              {INCOME_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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
              This is a recurring income
            </span>
          </label>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : income ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function IncomePage() {
  const {
    income,
    addIncome,
    updateIncome,
    deleteIncome,
    isLoading,
  } = useFinancialData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const filteredIncome = income
    .filter((i) => {
      const matchesSearch =
        i.source.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || i.income_type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSave = async (data: Omit<Income, 'id' | 'user_id' | 'created_at'>) => {
    if (editingIncome) {
      await updateIncome(editingIncome.id, data);
    } else {
      await addIncome(data);
    }
    setEditingIncome(null);
  };

  const handleEdit = (item: Income) => {
    setEditingIncome(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      await deleteIncome(id);
    }
  };

  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);

  const incomeByType = income.reduce((acc, i) => {
    acc[i.income_type] = (acc[i.income_type] || 0) + Number(i.amount);
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
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Income</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Track and manage your income sources
          </p>
        </div>
        <button
          onClick={() => {
            setEditingIncome(null);
            setModalOpen(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Income
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Income</p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
        </div>

        {INCOME_TYPES.slice(0, 3).map((type) => (
          <div key={type.value} className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <RefreshCcw className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">{type.label}</p>
                <p className="text-xl font-bold text-secondary-900 dark:text-white">
                  {formatCurrency(incomeByType[type.value] || 0)}
                </p>
              </div>
            </div>
          </div>
        ))}
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
              placeholder="Search income..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-secondary-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">All Types</option>
              {INCOME_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Source</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Amount</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Recurring</th>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncome.length > 0 ? (
                filteredIncome.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">{item.source}</p>
                        {item.description && (
                          <p className="text-xs text-secondary-500 truncate max-w-[200px]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge-primary capitalize">{item.income_type}</span>
                    </td>
                    <td className="table-cell font-semibold text-success-500">
                      +{formatCurrency(Number(item.amount))}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-secondary-400" />
                        {format(new Date(item.date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="table-cell">
                      {item.is_recurring ? (
                        <span className="badge-success">Yes</span>
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-8 text-secondary-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No income records found</p>
                    <p className="text-sm">Add your first income to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IncomeModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingIncome(null);
        }}
        income={editingIncome}
        onSave={handleSave}
      />
    </div>
  );
}
