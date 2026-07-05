import React, { useState } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import { format } from 'date-fns';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  X,
  CheckCircle,
} from 'lucide-react';
import type { SavingsGoal, SavingsGoalCategory } from '../../types';
import { SAVINGS_GOAL_CATEGORIES } from '../../types';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: SavingsGoal | null;
  onSave: (data: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_amount' | 'is_completed'>) => void;
}

function GoalModal({ isOpen, onClose, goal, onSave }: GoalModalProps) {
  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || '');
  const [targetDate, setTargetDate] = useState(goal?.target_date || '');
  const [category, setCategory] = useState<SavingsGoalCategory>(goal?.category || 'other');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.target_amount.toString());
      setTargetDate(goal.target_date || '');
      setCategory(goal.category);
    } else {
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setCategory('other');
    }
  }, [goal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await onSave({
      name,
      target_amount: parseFloat(targetAmount),
      target_date: targetDate || null,
      category,
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
            {goal ? 'Edit Goal' : 'Create Savings Goal'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g., Emergency Fund, Vacation"
              required
            />
          </div>

          <div>
            <label className="input-label">Target Amount ({CURRENCY_SYMBOL})</label>
            <input
              type="number"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="input-label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SavingsGoalCategory)}
              className="input-field"
            >
              {SAVINGS_GOAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Target Date (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-field"
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : goal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GoalsPage() {
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    isLoading,
  } = useFinancialData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const handleSave = async (data: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_amount' | 'is_completed'>) => {
    if (editingGoal) {
      await updateSavingsGoal(editingGoal.id, data);
    } else {
      await addSavingsGoal(data);
    }
    setEditingGoal(null);
  };

  const handleContribute = async () => {
    if (!contributeGoal || !contributionAmount) return;
    const newAmount = contributeGoal.current_amount + parseFloat(contributionAmount);
    const isCompleted = newAmount >= contributeGoal.target_amount;
    await updateSavingsGoal(contributeGoal.id, {
      current_amount: newAmount,
      is_completed: isCompleted,
    });
    setContributeGoal(null);
    setContributionAmount('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this savings goal?')) {
      await deleteSavingsGoal(id);
    }
  };

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.target_amount, 0);

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
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Savings Goals</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Track and achieve your financial goals
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setModalOpen(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Saved</p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(totalSaved)}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Total Target</p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(totalTarget)}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <p className="text-sm text-secondary-500">Completed</p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {savingsGoals.filter((g) => g.is_completed).length} / {savingsGoals.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.length > 0 ? (
          savingsGoals.map((goal) => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            const categoryInfo = SAVINGS_GOAL_CATEGORIES.find((c) => c.value === goal.category);
            const daysRemaining = goal.target_date
              ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const monthlyRequired = goal.target_date && daysRemaining
              ? (goal.target_amount - goal.current_amount) / (daysRemaining / 30)
              : null;

            return (
              <div key={goal.id} className="glass-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="badge-primary">{categoryInfo?.label}</span>
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mt-2">
                      {goal.name}
                    </h3>
                  </div>
                  {goal.is_completed && (
                    <div className="w-8 h-8 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success-500" />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-secondary-600 dark:text-secondary-400">Progress</span>
                    <span className="font-semibold text-secondary-900 dark:text-white">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${goal.is_completed ? 'bg-success-500' : ''}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm text-secondary-500">Saved</p>
                    <p className="text-xl font-bold text-success-500">
                      {formatCurrency(goal.current_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary-500">Target</p>
                    <p className="text-xl font-bold text-secondary-900 dark:text-white">
                      {formatCurrency(goal.target_amount)}
                    </p>
                  </div>
                </div>

                {goal.target_date && !goal.is_completed && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary-50/50 dark:bg-secondary-800/50 mb-4">
                    <Calendar className="w-4 h-4 text-secondary-400" />
                    <div className="flex-1">
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        {daysRemaining} days remaining
                      </p>
                      {monthlyRequired && monthlyRequired > 0 && (
                        <p className="text-xs text-secondary-500">
                          Save {formatCurrency(monthlyRequired)}/month
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!goal.is_completed && (
                  <button
                    onClick={() => setContributeGoal(goal)}
                    className="btn-primary w-full mb-3"
                  >
                    Add Contribution
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingGoal(goal);
                      setModalOpen(true);
                    }}
                    className="btn-ghost flex-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="btn-ghost text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full glass-card text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <p className="text-secondary-600 dark:text-secondary-400 mb-2">No savings goals yet</p>
            <p className="text-sm text-secondary-500 mb-4">Create your first goal to start tracking</p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Goal
            </button>
          </div>
        )}
      </div>

      <GoalModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGoal(null);
        }}
        goal={editingGoal}
        onSave={handleSave}
      />

      {contributeGoal && (
        <div className="modal-overlay" onClick={() => setContributeGoal(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
                Add Contribution
              </h2>
              <button onClick={() => setContributeGoal(null)} className="p-2 rounded-lg hover:bg-secondary-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-secondary-600 dark:text-secondary-400">
                Adding to: <strong>{contributeGoal.name}</strong>
              </p>
              <p className="text-sm text-secondary-500">
                Current: {formatCurrency(contributeGoal.current_amount)} / {formatCurrency(contributeGoal.target_amount)}
              </p>
            </div>

            <div className="mb-6">
              <label className="input-label">Amount ({CURRENCY_SYMBOL})</label>
              <input
                type="number"
                step="0.01"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="input-field"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setContributeGoal(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleContribute} className="btn-primary flex-1">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
