import React, { useState, useRef, useEffect } from 'react';
import { useFinancialData } from '../../hooks/useFinancialData';
import { useStore } from '../../store';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  MessageCircle,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatPage() {
  const { user } = useAuth();
  const { income, expenses, savingsGoals, addIncome, addExpense, addBudget } = useFinancialData();
  const { chatHistory, setChatHistory, clearChatHistory, addChatMessage } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatState, setChatState] = useState<{
    stage: 'idle' | 'awaiting_income_input' | 'awaiting_budget_approval' | 'awaiting_budget_application' | 'clarifying_number';
    tempIncome?: number;
    tempNumber?: number;
    tempBudgetPlan?: any;
  }>({ stage: 'idle' });

  // Custom number parser supporting suffix multipliers
  const parseNumber = (text: string): number | null => {
    let clean = text.toLowerCase().replace(/[,₹\s]/g, '');
    let multiplier = 1;
    if (clean.endsWith('k')) {
      multiplier = 1000;
      clean = clean.slice(0, -1);
    } else if (clean.endsWith('lakh') || clean.endsWith('lac') || clean.endsWith('lakhs')) {
      multiplier = 100000;
      clean = clean.replace(/lakhs|lakh|lac/g, '');
    } else if (clean.endsWith('l')) {
      multiplier = 100000;
      clean = clean.slice(0, -1);
    } else if (clean.endsWith('cr') || clean.endsWith('crore') || clean.endsWith('crores')) {
      multiplier = 10000000;
      clean = clean.replace(/crores|crore|cr/g, '');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? null : num * multiplier;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        setChatHistory(data);
      }
    };
    fetchHistory();
  }, [user, setChatHistory]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      const convertedMessages: Message[] = [];
      chatHistory.forEach((msg) => {
        convertedMessages.push({
          id: `${msg.id}-user`,
          role: 'user',
          content: msg.message,
          timestamp: new Date(msg.created_at),
        });
        convertedMessages.push({
          id: `${msg.id}-assistant`,
          role: 'assistant',
          content: msg.response,
          timestamp: new Date(msg.created_at),
        });
      });
      setMessages(convertedMessages);
    } else {
      setMessages([]);
    }
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsgContent = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsgContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const lowerInput = userMsgContent.toLowerCase();

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      const totalIncome = income
        .filter((i) => {
          const date = new Date(i.date);
          return date >= currentMonthStart && date <= currentMonthEnd;
        })
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const categoryExpenses: Record<string, number> = {};
      expenses
        .filter((e) => {
          const date = new Date(e.date);
          return date >= currentMonthStart && date <= currentMonthEnd;
        })
        .forEach((e) => {
          categoryExpenses[e.category] = (categoryExpenses[e.category] || 0) + Number(e.amount);
        });

      const totalExpenses = Object.values(categoryExpenses).reduce((a, b) => a + b, 0);

      let replyContent = '';
      const nextState = { ...chatState };

      // 1. Conversation State Machine
      if (chatState.stage === 'awaiting_income_input') {
        const num = parseNumber(userMsgContent);
        if (num !== null && num > 0) {
          nextState.stage = 'awaiting_budget_approval';
          nextState.tempIncome = num;
          replyContent = `Great! Let's use a monthly income of **${formatCurrency(num)}** to plan. Here is the standard 50/30/20 budget breakdown:\n\n*   **Needs (50%):** ${formatCurrency(num * 0.5)}\n*   **Wants (30%):** ${formatCurrency(num * 0.3)}\n*   **Savings/Debt (20%):** ${formatCurrency(num * 0.2)}\n\nWould you like me to generate a detailed, category-by-category budget plan for you?`;
        } else if (lowerInput === 'cancel' || lowerInput === 'exit') {
          nextState.stage = 'idle';
          replyContent = `Cancelled income input. How else can I help you today?`;
        } else {
          replyContent = `I couldn't understand that amount. Please enter a valid number (e.g., 50000 or 1.2L) for your monthly income, or type "cancel" to exit.`;
        }
      }
      else if (chatState.stage === 'awaiting_budget_approval') {
        if (lowerInput === 'yes' || lowerInput === 'y' || lowerInput.includes('sure') || lowerInput.includes('please') || lowerInput.includes('ok')) {
          const planIncome = chatState.tempIncome || totalIncome;
          const planSavings = Math.round(planIncome * 0.2);

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent?action=budget-plan`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                income: planIncome,
                savingsTarget: planSavings,
                currentExpenses: categoryExpenses,
              }),
            }
          );

          if (response.ok) {
            const planData = await response.json();
            nextState.stage = 'awaiting_budget_application';
            nextState.tempBudgetPlan = planData;

            const categoryBreakdown = planData.categories.map((c: any) => {
              const label = EXPENSE_CATEGORIES.find(cat => cat.value === c.category)?.label || c.category;
              return `*   **${label}:** ${formatCurrency(c.amount)} (${c.percentage}%)`;
            }).join('\n');

            replyContent = `Here is your detailed AI Budget Plan:\n\n${planData.explanation}\n\n**Category Allocations:**\n${categoryBreakdown}\n\n*   **Savings Target:** ${formatCurrency(planData.savings_target)}\n*   **Emergency Fund Allocation:** ${formatCurrency(planData.emergency_fund)}\n\nWould you like me to apply and save this budget plan to your account?`;
          } else {
            replyContent = `I encountered an issue generating the detailed budget plan. Please try again later.`;
            nextState.stage = 'idle';
          }
        } else {
          replyContent = `No problem! Let me know what you would like to do next. You can ask me to plan a budget anytime.`;
          nextState.stage = 'idle';
        }
      }
      else if (chatState.stage === 'awaiting_budget_application') {
        if (lowerInput === 'yes' || lowerInput === 'y' || lowerInput.includes('sure') || lowerInput.includes('please') || lowerInput.includes('ok')) {
          const plan = chatState.tempBudgetPlan;
          if (plan && plan.categories) {
            const month = new Date().getMonth() + 1;
            const year = new Date().getFullYear();

            for (const c of plan.categories) {
              await addBudget({
                category: c.category,
                allocated_amount: c.amount,
                month,
                year
              });
            }
            replyContent = `Success! I have created and saved these category budgets to your account for this month. You can view them on the **Budget** page.`;
          } else {
            replyContent = `I couldn't find the generated plan to save. Please try starting the budget planning again.`;
          }
          nextState.stage = 'idle';
          nextState.tempBudgetPlan = null;
        } else {
          replyContent = `Alright, I won't save this budget plan to your account. Let me know if you'd like to try again or look at something else!`;
          nextState.stage = 'idle';
          nextState.tempBudgetPlan = null;
        }
      }
      else if (chatState.stage === 'clarifying_number') {
        const num = chatState.tempNumber || 0;
        if (lowerInput === '1' || lowerInput.includes('income for budget') || lowerInput.includes('budget')) {
          nextState.stage = 'awaiting_budget_approval';
          nextState.tempIncome = num;
          replyContent = `Got it! Let's use **${formatCurrency(num)}** as your monthly income. Here is the standard 50/30/20 budget breakdown:\n\n*   **Needs (50%):** ${formatCurrency(num * 0.5)}\n*   **Wants (30%):** ${formatCurrency(num * 0.3)}\n*   **Savings/Debt (20%):** ${formatCurrency(num * 0.2)}\n\nWould you like me to generate a detailed, category-by-category budget plan for you?`;
        }
        else if (lowerInput === '2' || lowerInput.includes('record income')) {
          const { error } = await addIncome({
            amount: num,
            source: 'Other',
            income_type: 'other',
            description: 'Recorded via AI Chatbot',
            date: format(new Date(), 'yyyy-MM-dd'),
            is_recurring: false
          });

          if (!error) {
            replyContent = `Successfully recorded a new income transaction of **${formatCurrency(num)}** under 'Other' for today!`;
          } else {
            replyContent = `I encountered an error recording that income. Please try again.`;
          }
          nextState.stage = 'idle';
        }
        else if (lowerInput === '3' || lowerInput.includes('record expense') || lowerInput.includes('spend')) {
          const { error } = await addExpense({
            amount: num,
            category: 'others',
            description: 'Recorded via AI Chatbot',
            date: format(new Date(), 'yyyy-MM-dd'),
            is_recurring: false
          });

          if (!error) {
            replyContent = `Successfully recorded a new expense transaction of **${formatCurrency(num)}** under 'Others' for today!`;
          } else {
            replyContent = `I encountered an error recording that expense. Please try again.`;
          }
          nextState.stage = 'idle';
        }
        else if (lowerInput === 'cancel' || lowerInput === 'exit') {
          nextState.stage = 'idle';
          replyContent = `Cancelled action. What else can I help you with?`;
        }
        else {
          replyContent = `Please select a valid option:\n1. Use as monthly income for budget planning\n2. Record as a new income transaction\n3. Record as a new expense transaction\n\nOr type "cancel" to exit.`;
        }
      }
      // 2. Normal Flow Intents
      else {
        if (lowerInput === 'hi' || lowerInput === 'hello' || lowerInput === 'hlo' || lowerInput === 'hey') {
          replyContent = `Hello! I'm your BudgetWise AI assistant. 🌟\n\nBased on your records for this month:\n*   **Monthly Income:** ${formatCurrency(totalIncome)}\n*   **Monthly Expenses:** ${formatCurrency(totalExpenses)}\n*   **Net Available:** ${formatCurrency(totalIncome - totalExpenses)}\n\nI can help you with saving strategies, budget planning, expense analysis, or recording transactions. What would you like to focus on?`;
        }
        else if (lowerInput.includes('about you') || lowerInput.includes('who are you') || lowerInput.includes('know about you')) {
          replyContent = `I am your BudgetWise AI assistant! 🌟\n\nI was created to help you manage your personal finances intelligently. I can analyze your income and expenses, suggest saving targets, help you allocate budgets, and track your financial health. You can ask me questions like 'How can I save more?' or 'Why am I overspending?'`;
        }
        else if (lowerInput.includes('budget') || lowerInput.includes('plan')) {
          if (totalIncome === 0) {
            nextState.stage = 'awaiting_income_input';
            replyContent = `I'd love to help you plan a budget! However, your current monthly income is recorded as ₹0. What is your typical monthly income?`;
          } else {
            nextState.stage = 'awaiting_budget_approval';
            nextState.tempIncome = totalIncome;
            replyContent = `Here is a standard 50/30/20 budget breakdown based on your monthly income of **${formatCurrency(totalIncome)}**:\n\n*   **Needs (50%):** ${formatCurrency(totalIncome * 0.5)}\n*   **Wants (30%):** ${formatCurrency(totalIncome * 0.3)}\n*   **Savings/Debt (20%):** ${formatCurrency(totalIncome * 0.2)}\n\nWould you like me to generate a detailed, category-by-category budget plan for you?`;
          }
        }
        else {
          const num = parseNumber(userMsgContent);
          if (num !== null && num > 0) {
            nextState.stage = 'clarifying_number';
            nextState.tempNumber = num;
            replyContent = `I detected the amount **${formatCurrency(num)}**. Would you like me to:\n\n1. Use this as your monthly income to plan a budget?\n2. Record this as a new income transaction?\n3. Record this as a new expense transaction?\n\nType the option number (1, 2, or 3) to choose.`;
          } else {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent?action=chat`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  message: userMsgContent,
                  context: {
                    income: totalIncome,
                    expenses: totalExpenses,
                    savings: totalIncome - totalExpenses,
                    categories: categoryExpenses,
                  },
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              replyContent = data.response;
            } else {
              replyContent = `I'm your financial assistant! Based on your data:\n\n- Monthly Income: ${formatCurrency(totalIncome)}\n- Monthly Expenses: ${formatCurrency(totalExpenses)}\n- Available: ${formatCurrency(totalIncome - totalExpenses)}\n\nI can help you with saving strategies, budget planning, expense analysis, investment recommendations, or debt management. What would you like to know more about?`;
            }
          }
        }
      }

      setChatState(nextState);

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);

      if (user) {
        supabase
          .from('chat_history')
          .insert({
            user_id: user.id,
            message: userMessage.content,
            response: replyContent,
          })
          .select()
          .single()
          .then(({ data: dbData, error: dbError }) => {
            if (!dbError && dbData) {
              addChatMessage(dbData);
            }
          })
          .catch((err) => {
            console.error('Failed to save chat to database:', err);
          });
      }
    } catch (err) {
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      await supabase.from('chat_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setMessages([]);
      clearChatHistory();
    }
  };

  const suggestedQuestions = [
    'How can I save more money?',
    'Why am I overspending?',
    'Can I afford a major purchase?',
    'How should I plan my budget?',
    'What is an emergency fund?',
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">AI Assistant</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Ask questions about your finances
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="btn-ghost text-error-500 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                Hello! I'm your AI Financial Assistant
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
                I can help you understand your spending, plan your budget, and answer questions about your personal finances.
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(question)}
                    className="px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 text-sm hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-secondary-200 dark:bg-secondary-700'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-secondary-600 dark:text-secondary-300" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white rounded-br-sm'
                        : 'bg-secondary-100 dark:bg-secondary-800 rounded-bl-sm text-secondary-700 dark:text-secondary-300'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-primary-200' : 'text-secondary-400'
                      }`}
                    >
                      {format(message.timestamp, 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-secondary-600 dark:text-secondary-300" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-secondary-100 dark:bg-secondary-800">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-secondary-200/20 dark:border-secondary-700/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your finances..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary px-6"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
