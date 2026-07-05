import React, { useState, useMemo } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  BellOff
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../types';
import { formatCurrency } from '../../utils/currency';

export function RecurringBillsPage() {
  const { income, expenses } = useFinancialData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  
  // Local storage persisted state for paid occurrences: YYYY-MM-DD-transactionId
  const [paidOccurrences, setPaidOccurrences] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('budgetwise-paid-bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePaidStatus = (transactionId: string, dayStr: string) => {
    const key = `${dayStr}-${transactionId}`;
    let updated;
    if (paidOccurrences.includes(key)) {
      updated = paidOccurrences.filter(k => k !== key);
    } else {
      updated = [...paidOccurrences, key];
    }
    setPaidOccurrences(updated);
    localStorage.setItem('budgetwise-paid-bills', JSON.stringify(updated));
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Get all recurring transactions
  const recurringItems = useMemo(() => {
    const inc = income
      .filter((i) => i.is_recurring)
      .map((i) => ({ ...i, type: 'income' as const }));
    const exp = expenses
      .filter((e) => e.is_recurring)
      .map((e) => ({ ...e, type: 'expense' as const }));
    return [...inc, ...exp];
  }, [income, expenses]);

  // Calendar dates generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Find bills for a specific day
  const getBillsForDay = (day: Date) => {
    const dayOfMonth = day.getDate();
    return recurringItems.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getDate() === dayOfMonth;
    });
  };

  // Metrics
  const monthlyMetrics = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentDate) });
    
    let totalDue = 0;
    let totalPaid = 0;
    let totalRecurIncome = 0;

    daysInMonth.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const bills = getBillsForDay(day);

      bills.forEach(bill => {
        const isPaid = paidOccurrences.includes(`${dayStr}-${bill.id}`);
        if (bill.type === 'expense') {
          totalDue += Number(bill.amount);
          if (isPaid) {
            totalPaid += Number(bill.amount);
          }
        } else if (bill.type === 'income') {
          totalRecurIncome += Number(bill.amount);
        }
      });
    });

    return {
      totalDue,
      totalPaid,
      totalRecurIncome,
      progressPercent: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0
    };
  }, [currentDate, recurringItems, paidOccurrences]);

  // Upcoming bills next 15 days
  const upcomingBillsList = useMemo(() => {
    const list: Array<{ date: Date; items: typeof recurringItems }> = [];
    const today = new Date();
    
    for (let i = 0; i < 15; i++) {
      const targetDay = new Date();
      targetDay.setDate(today.getDate() + i);
      const dayBills = getBillsForDay(targetDay).filter(b => b.type === 'expense');
      if (dayBills.length > 0) {
        list.push({
          date: targetDay,
          items: dayBills
        });
      }
    }
    return list;
  }, [recurringItems]);

  const selectedDateBills = useMemo(() => {
    return getBillsForDay(selectedDate);
  }, [selectedDate, recurringItems]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const monthName = format(currentDate, 'MMMM yyyy');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Recurring Bills</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Track and manage your scheduled monthly payments and incoming flows
          </p>
        </div>
        <button
          onClick={() => setRemindersEnabled(!remindersEnabled)}
          className={`btn-secondary inline-flex items-center gap-2 py-2.5 ${remindersEnabled ? 'text-primary-500 bg-primary-500/5' : 'text-secondary-500'}`}
        >
          {remindersEnabled ? (
            <>
              <Bell className="w-4 h-4 text-primary-500" />
              Reminders Enabled
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4" />
              Reminders Paused
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Recurring Bills</p>
            <div className="w-8 h-8 rounded-lg bg-error-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-error-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">
            {formatCurrency(monthlyMetrics.totalDue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-secondary-500 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled for {format(currentDate, 'MMMM')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Recurring Income</p>
            <div className="w-8 h-8 rounded-lg bg-success-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">
            {formatCurrency(monthlyMetrics.totalRecurIncome)}
          </p>
          <div className="flex items-center mt-2">
            <span className="text-xs text-success-600 bg-success-500/10 px-2 py-0.5 rounded-full font-semibold">
              Steady Cash Flow
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Bills Settle Progress</p>
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">
            {monthlyMetrics.progressPercent}%
          </p>
          <div className="space-y-1 mt-2">
            <div className="progress-bar">
              <div
                className="progress-fill bg-gradient-to-r from-success-400 to-success-600"
                style={{ width: `${monthlyMetrics.progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-secondary-400">
              Paid: {formatCurrency(monthlyMetrics.totalPaid)} / {formatCurrency(monthlyMetrics.totalDue)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View Card */}
        <div className="lg:col-span-2 glass-card flex flex-col justify-between">
          <div>
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary-500" />
                {monthName}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                </button>
              </div>
            </div>

            {/* Weekdays Names Row */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-secondary-500 mb-2">
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
              <div>SUN</div>
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                const dayBills = getBillsForDay(day);
                const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, currentDate);
                const todayCheck = isToday(day);
                
                // Indicators logic
                const hasRecurringExp = dayBills.some(b => b.type === 'expense');
                const hasRecurringInc = dayBills.some(b => b.type === 'income');
                const allExpensesPaid = dayBills.length > 0 && dayBills.filter(b => b.type === 'expense').every(b => paidOccurrences.includes(`${format(day, 'yyyy-MM-dd')}-${b.id}`));

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`h-16 flex flex-col justify-between p-1.5 rounded-xl border transition-all relative ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500' 
                        : 'border-secondary-100 dark:border-secondary-800/40 hover:border-secondary-300 dark:hover:border-secondary-700'
                    } ${isCurrentMonth ? 'text-secondary-900 dark:text-secondary-100' : 'text-secondary-400 dark:text-secondary-600 opacity-40'} ${
                      todayCheck ? 'bg-secondary-100/50 dark:bg-secondary-800/30' : ''
                    }`}
                  >
                    {/* Day number */}
                    <span className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                      todayCheck ? 'bg-primary-500 text-white font-bold' : ''
                    }`}>
                      {day.getDate()}
                    </span>

                    {/* Indicators bar */}
                    <div className="flex justify-center gap-1 w-full mt-1">
                      {hasRecurringInc && (
                        <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                      )}
                      {hasRecurringExp && (
                        <span className={`w-1.5 h-1.5 rounded-full ${allExpensesPaid ? 'bg-success-500/40 line-through' : 'bg-error-500'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 mt-6 text-xs text-secondary-500 border-t pt-4 border-secondary-100 dark:border-secondary-800/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
              <span>Recurring Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-error-500" />
              <span>Unpaid Bills</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success-500/40" />
              <span>Settled Bills</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="space-y-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">
              Flows on {format(selectedDate, 'dd MMM yyyy')}
            </h3>

            {selectedDateBills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-secondary-300 mb-2" />
                <p className="text-sm font-medium text-secondary-500">No scheduled bills or incomes due today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateBills.map((bill) => {
                  const isPaid = paidOccurrences.includes(`${selectedDateStr}-${bill.id}`);
                  const categoryInfo = bill.type === 'expense' ? EXPENSE_CATEGORIES.find(c => c.value === bill.category) : null;
                  const label = bill.type === 'income' ? bill.source : (categoryInfo?.label || bill.category);
                  
                  return (
                    <div
                      key={bill.id}
                      className="p-3 rounded-xl bg-secondary-50/50 dark:bg-secondary-800/30 border border-secondary-100 dark:border-secondary-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge ${bill.type === 'income' ? 'badge-success' : 'badge-error'}`}>
                            {bill.type.toUpperCase()}
                          </span>
                          <span className="font-bold text-sm text-secondary-800 dark:text-secondary-200 truncate">{label}</span>
                        </div>
                        <p className="text-xs text-secondary-500 truncate">{bill.description || 'Monthly recurrence'}</p>
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white mt-1">
                          {formatCurrency(Number(bill.amount))}
                        </p>
                      </div>

                      {bill.type === 'expense' && (
                        <button
                          onClick={() => togglePaidStatus(bill.id, selectedDateStr)}
                          className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                            isPaid 
                              ? 'bg-success-500/10 border-success-500/20 text-success-500' 
                              : 'bg-secondary-100 hover:bg-secondary-200 border-secondary-200 text-secondary-500 dark:bg-secondary-800 dark:border-secondary-700'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chronological Reminders sidebar */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning-500" />
              Next 15 Days
            </h3>

            {upcomingBillsList.length === 0 ? (
              <p className="text-xs text-secondary-500 py-4">No upcoming bills scheduled for the next 15 days.</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {upcomingBillsList.map((dayGroup, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-xs font-bold text-secondary-400 uppercase tracking-wider">
                      {format(dayGroup.date, 'dd MMM (EEEE)')}
                    </h4>
                    {dayGroup.items.map((bill) => {
                      const billDayStr = format(dayGroup.date, 'yyyy-MM-dd');
                      const isPaid = paidOccurrences.includes(`${billDayStr}-${bill.id}`);
                      const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === bill.category);
                      const label = categoryInfo?.label || bill.category;

                      return (
                        <div
                          key={bill.id}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                            isPaid 
                              ? 'bg-success-500/5 border-success-500/10 opacity-70' 
                              : 'bg-secondary-50 dark:bg-secondary-800/20 border-secondary-100 dark:border-secondary-800/30'
                          }`}
                        >
                          <div>
                            <span className={`font-semibold ${isPaid ? 'line-through text-secondary-500' : 'text-secondary-800 dark:text-secondary-200'}`}>
                              {label}
                            </span>
                            <span className="text-secondary-400 block">{formatCurrency(Number(bill.amount))}</span>
                          </div>
                          
                          <button
                            onClick={() => togglePaidStatus(bill.id, billDayStr)}
                            className={`p-1.5 rounded-lg border ${
                              isPaid 
                                ? 'bg-success-500/10 border-success-500/20 text-success-500' 
                                : 'bg-white hover:bg-secondary-100 border-secondary-200 text-secondary-400 dark:bg-secondary-800 dark:border-secondary-700'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
