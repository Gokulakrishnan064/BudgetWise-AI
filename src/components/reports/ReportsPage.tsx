import React, { useState, useMemo } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import { format } from 'date-fns';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  Activity,
  ArrowUpRight,
  ArrowDownRight
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
  Legend,
  CartesianGrid
} from 'recharts';
import { EXPENSE_CATEGORIES } from '../../types';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function ReportsPage() {
  const { income, expenses, budgets, savingsGoals, isLoading } = useFinancialData();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= currentYear - 4; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Safe parsing helper to prevent timezone shift issues
  const getYearMonth = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10)
      };
    }
    const d = new Date(dateStr);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1
    };
  };

  // Filtered Data
  const monthlyIncomeList = useMemo(() => {
    return income.filter((i) => {
      const { year, month } = getYearMonth(i.date);
      return year === selectedYear && month === selectedMonth;
    });
  }, [income, selectedMonth, selectedYear]);

  const monthlyExpenseList = useMemo(() => {
    return expenses.filter((e) => {
      const { year, month } = getYearMonth(e.date);
      return year === selectedYear && month === selectedMonth;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const monthlyBudgets = useMemo(() => {
    return budgets.filter((b) => b.month === selectedMonth && b.year === selectedYear);
  }, [budgets, selectedMonth, selectedYear]);

  // Calculations
  const totalIncome = useMemo(() => {
    return monthlyIncomeList.reduce((sum, i) => sum + Number(i.amount), 0);
  }, [monthlyIncomeList]);

  const totalExpenses = useMemo(() => {
    return monthlyExpenseList.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [monthlyExpenseList]);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Expenses by Category
  const expensesByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    monthlyExpenseList.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
    });
    return totals;
  }, [monthlyExpenseList]);

  const pieData = useMemo(() => {
    return Object.entries(expensesByCategory).map(([category, amount]) => {
      const catConfig = EXPENSE_CATEGORIES.find((c) => c.value === category);
      return {
        name: catConfig?.label || category,
        value: amount,
        color: catConfig?.color || '#6b7280',
      };
    }).sort((a, b) => b.value - a.value);
  }, [expensesByCategory]);

  // Top Expense Category
  const topExpenseCategory = useMemo(() => {
    if (pieData.length === 0) return 'N/A';
    return pieData[0].name;
  }, [pieData]);

  // Combined transactions for listing
  const transactions = useMemo(() => {
    const list = [
      ...monthlyIncomeList.map((i) => ({ ...i, type: 'income' as const, categoryOrSource: i.source })),
      ...monthlyExpenseList.map((e) => ({ ...e, type: 'expense' as const, categoryOrSource: EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label || e.category })),
    ];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthlyIncomeList, monthlyExpenseList]);

  // Income vs Expense comparison daily
  const dailyChartData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      income: 0,
      expenses: 0,
    }));

    monthlyIncomeList.forEach((inc) => {
      const day = new Date(inc.date).getDate();
      if (day > 0 && day <= daysInMonth) {
        data[day - 1].income += Number(inc.amount);
      }
    });

    monthlyExpenseList.forEach((exp) => {
      const day = new Date(exp.date).getDate();
      if (day > 0 && day <= daysInMonth) {
        data[day - 1].expenses += Number(exp.amount);
      }
    });

    return data;
  }, [monthlyIncomeList, monthlyExpenseList, selectedMonth, selectedYear]);

  // Financial Health Score calculation for the month
  const healthScore = useMemo(() => {
    const rateScore = Math.max(0, Math.min(100, savingsRate * 2)); // 50% savings rate = 100 points
    const expenseToIncomeRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
    const expenseScore = Math.max(0, 100 - expenseToIncomeRatio); // 0 expenses = 100 points, >100% = 0 points
    
    // Budget adherence
    let overBudgetCount = 0;
    monthlyBudgets.forEach(b => {
      if (b.spent_amount > b.allocated_amount) overBudgetCount++;
    });
    const budgetScore = monthlyBudgets.length > 0 
      ? Math.max(0, 100 - (overBudgetCount / monthlyBudgets.length) * 100)
      : 100;

    return Math.round((rateScore * 0.4) + (expenseScore * 0.4) + (budgetScore * 0.2));
  }, [savingsRate, totalIncome, totalExpenses, monthlyBudgets]);

  const healthRating = useMemo(() => {
    if (healthScore >= 80) return { label: 'Excellent', color: 'text-success-500 bg-success-500/10' };
    if (healthScore >= 60) return { label: 'Good', color: 'text-primary-500 bg-primary-500/10' };
    if (healthScore >= 40) return { label: 'Average', color: 'text-warning-500 bg-warning-500/10' };
    return { label: 'Needs Attention', color: 'text-error-500 bg-error-500/10' };
  }, [healthScore]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount (INR)', 'Category/Source', 'Description', 'Recurring'];
    const rows = transactions.map(t => [
      t.date,
      t.type.toUpperCase(),
      t.amount.toString(),
      t.categoryOrSource,
      t.description || '',
      t.is_recurring ? 'Yes' : 'No'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || selectedMonth;
    link.setAttribute('download', `Financial_Report_${monthLabel}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || selectedMonth;
      pdf.save(`Financial_Report_${monthLabel}_${selectedYear}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 glass p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">Report Period:</span>
          </div>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="input-field py-2 pr-8 w-40 text-sm"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input-field py-2 pr-8 w-28 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="btn-secondary inline-flex items-center gap-2 py-2.5 text-sm"
            disabled={transactions.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-primary inline-flex items-center gap-2 py-2.5 text-sm"
            disabled={transactions.length === 0 || isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-secondary-400" />
          </div>
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">No Data Available</h3>
          <p className="text-secondary-600 dark:text-secondary-400 max-w-sm">
            There are no recorded transactions (income or expenses) for {selectedMonthLabel} {selectedYear}. Please add some transactions first.
          </p>
        </div>
      ) : (
        <div id="report-content" className="space-y-6 bg-white dark:bg-secondary-900 p-2 md:p-4 rounded-3xl">
          {/* PDF Title Header (visible only for print styling / captured canvas) */}
          <div className="hidden print:block border-b pb-4 mb-6">
            <h1 className="text-3xl font-extrabold text-secondary-900">Financial Report</h1>
            <p className="text-secondary-500">Period: {selectedMonthLabel} {selectedYear}</p>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Income</p>
                <div className="w-8 h-8 rounded-lg bg-success-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(totalIncome)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-success-500 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Earned this month</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Expenses</p>
                <div className="w-8 h-8 rounded-lg bg-error-500/10 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-error-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(totalExpenses)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-error-500 font-semibold">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Spent this month</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Net Savings</p>
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-primary-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {formatCurrency(netSavings)}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${netSavings >= 0 ? 'text-success-700 bg-success-500/10' : 'text-error-700 bg-error-500/10'}`}>
                  {netSavings >= 0 ? 'Positive Surplus' : 'Deficit'}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Savings Rate</p>
                <div className="w-8 h-8 rounded-lg bg-warning-500/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-warning-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {savingsRate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-2">
                <span className="text-xs text-secondary-500 dark:text-secondary-400">
                  Target: 20.0%
                </span>
              </div>
            </div>
          </div>

          {/* AI Financial Health Score & Insight Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Financial Health Score</h3>
                  <Activity className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex flex-col items-center py-4">
                  <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-8 border-secondary-100 dark:border-secondary-800">
                    <span className="text-4xl font-extrabold text-secondary-900 dark:text-white">{healthScore}</span>
                    <span className="absolute bottom-2 text-xs font-bold text-secondary-500 uppercase">Score</span>
                  </div>
                  <span className={`mt-4 px-3 py-1 rounded-full text-sm font-bold ${healthRating.color}`}>
                    {healthRating.label}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-secondary-800 text-xs text-secondary-500 dark:text-secondary-400 text-center">
                Score is calculated based on savings rate, budget adherence, and expense ratio.
              </div>
            </div>

            <div className="glass-card lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white">AI Financial Summary</h3>
                </div>
                <div className="space-y-3 text-sm text-secondary-700 dark:text-secondary-300">
                  <p>
                    For the period of <strong>{selectedMonthLabel} {selectedYear}</strong>, your total incoming cash flow was <strong>{formatCurrency(totalIncome)}</strong>, while your total outgoing expenses amounted to <strong>{formatCurrency(totalExpenses)}</strong>.
                  </p>
                  <p>
                    {netSavings >= 0 ? (
                      <span>
                        You successfully maintained a positive surplus of <strong>{formatCurrency(netSavings)}</strong>, resulting in a healthy <strong>{savingsRate.toFixed(1)}%</strong> savings rate. This aligns nicely with best-practice financial targets.
                      </span>
                    ) : (
                      <span className="text-error-600 dark:text-error-400">
                        Warning: Your expenses exceeded your income by <strong>{formatCurrency(Math.abs(netSavings))}</strong>. This indicates a deficit for the month, which may require dipping into emergency savings or adjusting budget categories next month.
                      </span>
                    )}
                  </p>
                  <p>
                    Your highest spending category this month was <strong>{topExpenseCategory}</strong>. Focus on monitoring this category in upcoming months to identify cost-saving opportunities.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
                <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-secondary-600 dark:text-secondary-400">
                  <strong>Recommendation:</strong> Use the <strong>AI Insights</strong> page to obtain personalized recommendations and a customized financial budget plan built specifically for your spending habits.
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card">
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">Daily Income vs Expenses</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toFixed(0)}`, '']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card">
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">Expense Category Breakdown</h3>
              {pieData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-secondary-500">
                  No expenses recorded to chart.
                </div>
              ) : (
                <div className="h-72 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 overflow-y-auto max-h-60 space-y-2">
                    {pieData.map((entry, index) => {
                      const percentage = totalExpenses > 0 ? (entry.value / totalExpenses) * 100 : 0;
                      return (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="font-semibold text-secondary-700 dark:text-secondary-300">{entry.name}</span>
                          </div>
                          <span className="text-secondary-500 dark:text-secondary-400">
                            {formatCurrency(entry.value)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Budgets Progress Summary */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">Budget Progress & Overruns</h3>
            {monthlyBudgets.length === 0 ? (
              <p className="text-sm text-secondary-500">No active budgets set for this month.</p>
            ) : (
              <div className="space-y-4">
                {monthlyBudgets.map((b) => {
                  const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === b.category);
                  const label = categoryInfo?.label || b.category;
                  const percentUsed = b.allocated_amount > 0 ? (b.spent_amount / b.allocated_amount) * 100 : 0;
                  const isOver = b.spent_amount > b.allocated_amount;

                  return (
                    <div key={b.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-secondary-800 dark:text-secondary-200">{label}</span>
                          {isOver ? (
                            <span className="badge-error">Over Budget</span>
                          ) : (
                            <span className="badge-success">On Track</span>
                          )}
                        </div>
                        <span className="text-xs text-secondary-500">
                          {formatCurrency(b.spent_amount)} / {formatCurrency(b.allocated_amount)} ({percentUsed.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, percentUsed)}%`,
                            background: isOver 
                              ? 'linear-gradient(to right, #ef4444, #dc2626)' 
                              : percentUsed > 85 
                              ? 'linear-gradient(to right, #eab308, #ca8a04)' 
                              : 'linear-gradient(to right, #3b82f6, #2563eb)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transactions Detail Table */}
          <div className="table-container">
            <div className="px-6 py-4 border-b border-secondary-100 dark:border-secondary-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white">Transaction Logs</h3>
              <span className="text-xs text-secondary-500">{transactions.length} record(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Category / Source</th>
                    <th className="table-header-cell">Description</th>
                    <th className="table-header-cell text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="table-row">
                      <td className="table-cell whitespace-nowrap text-sm text-secondary-500">
                        {format(new Date(t.date), 'dd MMM yyyy')}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-error'}`}>
                          {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-secondary-800 dark:text-secondary-200">
                        {t.categoryOrSource}
                      </td>
                      <td className="table-cell text-sm text-secondary-600 dark:text-secondary-400">
                        {t.description || '-'}
                      </td>
                      <td className={`table-cell text-right font-bold ${t.type === 'income' ? 'text-success-600' : 'text-error-600'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
