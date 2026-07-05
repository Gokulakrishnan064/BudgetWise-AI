import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CURRENCY_SYMBOL = "₹";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface BudgetPlanRequest {
  income: number;
  savingsTarget: number;
  currentExpenses?: Record<string, number>;
}

interface BudgetPlanResponse {
  categories: { category: string; amount: number; percentage: number }[];
  savings_target: number;
  emergency_fund: number;
  total_income: number;
  explanation: string;
}

interface ExpenseAnalysisRequest {
  currentMonthExpenses: Record<string, number>;
  lastMonthExpenses: Record<string, number>;
  totalIncome: number;
}

interface FinancialHealthRequest {
  totalIncome: number;
  totalExpenses: number;
  savingsAmount: number;
  budgetAdherence: number;
}

function generateBudgetPlan(request: BudgetPlanRequest): BudgetPlanResponse {
  const { income, savingsTarget, currentExpenses = {} } = request;

  const availableForExpenses = income - savingsTarget;

  const categoryPercentages: Record<string, number> = {
    food: 0.20,
    transport: 0.10,
    shopping: 0.12,
    entertainment: 0.08,
    bills: 0.18,
    education: 0.08,
    healthcare: 0.08,
    emergency: 0.16,
  };

  const categories = Object.entries(categoryPercentages).map(([category, percentage]) => {
    let amount = availableForExpenses * percentage;

    if (currentExpenses[category]) {
      const historicalAvg = currentExpenses[category];
      const suggestedAmount = historicalAvg * 1.05;
      amount = Math.min(amount, suggestedAmount);
    }

    return {
      category,
      amount: Math.round(amount / 100) * 100,
      percentage: Math.round(percentage * 100),
    };
  });

  const totalAllocated = categories.reduce((sum, c) => sum + c.amount, 0);
  const emergencyFund = Math.min(savingsTarget * 0.3, availableForExpenses * 0.1);

  const explanation = `Based on your monthly income of ${formatCurrency(income)} and your goal to save ${formatCurrency(savingsTarget)}, I've created a budget that allocates ${Math.round((totalAllocated / income) * 100)}% for expenses and ${Math.round((savingsTarget / income) * 100)}% for savings. The largest allocation goes to food (${formatCurrency(categories.find(c => c.category === 'food')?.amount || 0)}) as it's typically the most variable expense. I've also set aside ${formatCurrency(emergencyFund)} as an emergency fund buffer. This budget follows the 50/30/20 rule adapted for your specific goals, ensuring essential needs are covered while prioritizing your savings target.`;

  return {
    categories,
    savings_target: savingsTarget,
    emergency_fund: Math.round(emergencyFund),
    total_income: income,
    explanation,
  };
}

function analyzeExpenses(request: ExpenseAnalysisRequest) {
  const { currentMonthExpenses, lastMonthExpenses, totalIncome } = request;

  const currentTotal = Object.values(currentMonthExpenses).reduce((a, b) => a + b, 0);
  const lastTotal = Object.values(lastMonthExpenses).reduce((a, b) => a + b, 0);

  const categoryBreakdown = Object.entries(currentMonthExpenses).map(([category, amount]) => ({
    category,
    amount,
    percentage: currentTotal > 0 ? Math.round((amount / currentTotal) * 100) : 0,
  }));

  const highestCategory = categoryBreakdown.sort((a, b) => b.amount - a.amount)[0];

  const insights: string[] = [];
  const alerts: string[] = [];

  Object.entries(currentMonthExpenses).forEach(([category, current]) => {
    const last = lastMonthExpenses[category] || 0;
    const change = last > 0 ? ((current - last) / last) * 100 : 0;

    if (change > 20) {
      insights.push(`You spent ${Math.round(change)}% more on ${category} this month compared to last month.`);
    } else if (change < -20) {
      insights.push(`Great job! You reduced ${category} spending by ${Math.abs(Math.round(change))}% this month.`);
    }

    const recommendedPercentage = {
      food: 15,
      transport: 10,
      entertainment: 5,
      shopping: 10,
      bills: 20,
    }[category] || 10;

    const actualPercentage = totalIncome > 0 ? (current / totalIncome) * 100 : 0;
    if (actualPercentage > recommendedPercentage + 5) {
      alerts.push(`Your ${category} spending (${formatCurrency(current)}) is ${Math.round(actualPercentage)}% of your income, exceeding the recommended ${recommendedPercentage}%.`);
    }
  });

  if (currentTotal > totalIncome * 0.8) {
    alerts.push(`Warning: You're spending ${Math.round((currentTotal / totalIncome) * 100)}% of your income. Consider reducing expenses.`);
  }

  return {
    total_spent: currentTotal,
    category_breakdown: categoryBreakdown,
    highest_spending_category: highestCategory?.category || 'N/A',
    insights,
    overspending_alerts: alerts,
  };
}

function calculateFinancialHealth(request: FinancialHealthRequest) {
  const { totalIncome, totalExpenses, savingsAmount, budgetAdherence } = request;

  const savingsRatio = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const spendingConsistency = Math.max(0, 100 - Math.abs(budgetAdherence));

  const score = Math.min(100, Math.max(0, Math.round(
    (savingsRatio * 0.35) +
    ((100 - expenseRatio) * 0.25) +
    (budgetAdherence * 0.25) +
    (spendingConsistency * 0.15)
  )));

  const rating = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'needs_improvement';

  return {
    score,
    rating,
    metrics: {
      savings_ratio: Math.round(savingsRatio),
      expense_ratio: Math.round(expenseRatio),
      budget_adherence: Math.round(budgetAdherence),
      spending_consistency: Math.round(spendingConsistency),
    },
  };
}

function generateSavingsAdvice(request: { income: number; currentSavings: number; goals: Array<{ name: string; target: number; current: number }> }) {
  const { income, currentSavings, goals } = request;

  const recommendedSavingsTarget = Math.round(income * 0.2);

  const emergencyTarget = income * 3;
  const emergencyMonthly = Math.round(emergencyTarget / 12);

  const costCutting = [
    'Review subscriptions and cancel unused services',
    'Cook at home more often to reduce food expenses',
    'Use public transportation or carpool',
    'Shop with a list to avoid impulse purchases',
    'Compare prices before major purchases',
    'Switch to more affordable brands',
    'Reduce energy consumption to lower bills',
    'Take advantage of discounts and cashback offers',
  ];

  const investments = [
    'Consider a high-yield savings account for your emergency fund',
    'Look into index funds for long-term growth',
    'Explore government savings bonds (PPF, NSC)',
    'Consider a diversified portfolio based on your risk tolerance',
    'Maximize your EPF/PPF contributions for tax benefits',
  ];

  return {
    recommended_savings_target: recommendedSavingsTarget,
    investment_recommendations: investments.slice(0, 3),
    emergency_fund_plan: {
      target_amount: emergencyTarget,
      monthly_contribution: emergencyMonthly,
      months_to_reach: 12,
    },
    cost_cutting_suggestions: costCutting.slice(0, 5),
  };
}

function predictBudget(request: { income: number; expensesSoFar: number; dayOfMonth: number; totalDaysInMonth: number; currentBudget: number }) {
  const { income, expensesSoFar, dayOfMonth, totalDaysInMonth, currentBudget } = request;

  const dailyAverage = expensesSoFar / dayOfMonth;
  const remainingDays = totalDaysInMonth - dayOfMonth;
  const predictedEndOfMonth = expensesSoFar + (dailyAverage * remainingDays);

  const willExceed = predictedEndOfMonth > currentBudget;
  const excessAmount = willExceed ? predictedEndOfMonth - currentBudget : 0;
  const futureSavings = income - predictedEndOfMonth;

  return {
    predicted_end_of_month_expenses: Math.round(predictedEndOfMonth),
    will_exceed_budget: willExceed,
    excess_amount: Math.round(excessAmount),
    future_savings_estimate: Math.round(futureSavings),
    confidence_level: dayOfMonth > 10 ? 85 : 65,
  };
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Invalid response structure from Gemini API");
  }
  return text;
}

async function chatbotResponse(request: { message: string; context: { income: number; expenses: number; savings: number; categories: Record<string, number> } }) {
  const { message, context } = request;
  
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiApiKey) {
    try {
      const systemPrompt = `You are a helpful, professional, and friendly AI Personal Finance Coach for BudgetWise AI.
You are assisting a user in managing their personal finances. You have access to their current month's financial context:
- Monthly Income: ${formatCurrency(context.income)}
- Monthly Expenses: ${formatCurrency(context.expenses)}
- Available Savings Margin: ${formatCurrency(context.income - context.expenses)}
- Expense Breakdown by Category: ${JSON.stringify(context.categories)}

Guidelines:
1. Provide actionable, supportive financial advice based on the user's specific context.
2. If they ask about their income, expenses, or available budget, reference the exact numbers above.
3. Be encouraging and promote positive saving habits.
4. Keep your replies concise and clean. Use bold headings and bullet points for readability.
5. Do not hallucinate transactions that are not in the context.
6. The default currency symbol is ₹ (INR).

User's message: ${message}`;

      const reply = await callGemini(systemPrompt, geminiApiKey);
      return { response: reply };
    } catch (err) {
      console.error("Gemini API error:", err);
    }
  }

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    const savingsRate = context.income > 0 ? ((context.income - context.expenses) / context.income * 100) : 0;
    return {
      response: `Based on your financial data, you're currently saving ${Math.round(savingsRate)}% of your income. To save more, consider:\n\n1. Reducing your highest expense category (${Object.entries(context.categories).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'})\n2. Setting up automatic transfers to savings\n3. Reviewing recurring subscriptions\n\nA good target is 20% of your income, which would be ${formatCurrency(context.income * 0.2)} for you.`,
    };
  }

  if (lowerMessage.includes('overspend') || lowerMessage.includes('spending too much')) {
    const topCategory = Object.entries(context.categories).sort(([,a], [,b]) => b - a)[0];
    return {
      response: `Looking at your data, your highest spending category is ${topCategory?.[0] || 'N/A'} with ${formatCurrency(topCategory?.[1] || 0)}.\n\nPossible reasons for overspending:\n- Lack of clear budget limits\n- Impulse purchases in this category\n- Seasonal or unexpected expenses\n\nTo address this, try:\n1. Setting a strict budget for ${topCategory?.[0] || 'this category'}\n2. Tracking every purchase immediately\n3. Waiting 24 hours before non-essential purchases`,
    };
  }

  if (lowerMessage.includes('buy') || lowerMessage.includes('afford')) {
    const available = context.income - context.expenses;
    return {
      response: `Your current available balance is ${formatCurrency(available)}. Before making a major purchase:\n\n1. Will this expense impact your essential bills?\n2. Do you have emergency savings (recommended: 3 months of expenses)?\n3. Is this a need or a want?\n\nSmart approach: Wait 72 hours before purchasing. If you still want it, compare prices first. If it exceeds your available balance, consider saving for it over 2-3 months.`,
    };
  }

  if (lowerMessage.includes('budget') || lowerMessage.includes('plan')) {
    return {
      response: `Here's how to create an effective budget:\n\n**50/30/20 Rule:**\n- 50% for needs (${formatCurrency(context.income * 0.5)} for you)\n- 30% for wants (${formatCurrency(context.income * 0.3)} for you)\n- 20% for savings (${formatCurrency(context.income * 0.2)} for you)\n\n**Action Steps:**\n1. List all income and expenses\n2. Categorize every expense\n3. Set realistic limits per category\n4. Review weekly\n5. Adjust monthly based on actual spending\n\nWould you like me to create a personalized budget plan for you?`,
    };
  }

  if (lowerMessage.includes('emergency fund') || lowerMessage.includes('emergency save')) {
    const target = context.income * 3;
    return {
      response: `An emergency fund should cover 3-6 months of expenses.\n\n**Your Target:** ${formatCurrency(target)} (3 months of income)\n\n**How to Build It:**\n1. Start with ${formatCurrency(10000)} as a mini-emergency fund\n2. Automate transfers after each paycheck\n3. Use a separate savings account\n4. Save any unexpected income (bonuses, gifts)\n\nAt ${formatCurrency(target / 12)}/month, you'll have 3 months of expenses saved in 12 months.`,
    };
  }

  return {
    response: `I'm your financial assistant! Based on your data:\n\n- Monthly Income: ${formatCurrency(context.income)}\n- Monthly Expenses: ${formatCurrency(context.expenses)}\n- Available: ${formatCurrency(context.income - context.expenses)}\n\nI can help you with:\n- Saving strategies\n- Budget planning\n- Expense analysis\n- Investment recommendations\n- Debt management\n\nWhat would you like to know more about?`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json();

    let result;

    switch (action) {
      case "budget-plan":
        result = generateBudgetPlan(body);
        break;
      case "expense-analysis":
        result = analyzeExpenses(body);
        break;
      case "financial-health":
        result = calculateFinancialHealth(body);
        break;
      case "savings-advice":
        result = generateSavingsAdvice(body);
        break;
      case "budget-prediction":
        result = predictBudget(body);
        break;
      case "chat":
        result = await chatbotResponse(body);
        break;
      default:
        throw new Error("Invalid action");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
