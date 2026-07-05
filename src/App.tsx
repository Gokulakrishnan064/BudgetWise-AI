import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './components/auth';
import { MainLayout } from './components/layout';
import { Dashboard } from './components/dashboard';
import { IncomePage } from './components/income';
import { ExpensesPage } from './components/expenses';
import { BudgetPage } from './components/budget';
import { GoalsPage } from './components/goals';
import { InsightsPage } from './components/insights';
import { ChatPage } from './components/chat';
import { ReportsPage } from './components/reports';
import { RecurringBillsPage } from './components/bills';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="ai-insights" element={<InsightsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="bills" element={<RecurringBillsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
