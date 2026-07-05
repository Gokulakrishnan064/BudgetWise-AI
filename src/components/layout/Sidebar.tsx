import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  Wallet,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Brain,
  BarChart3,
  Calendar,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/income', label: 'Income', icon: TrendingUp },
  { path: '/expenses', label: 'Expenses', icon: TrendingDown },
  { path: '/budget', label: 'Budget', icon: PiggyBank },
  { path: '/goals', label: 'Savings Goals', icon: Target },
  { path: '/ai-insights', label: 'AI Insights', icon: Brain },
  { path: '/chat', label: 'AI Chatbot', icon: MessageCircle },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/bills', label: 'Recurring Bills', icon: Calendar },
];

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme, setTheme } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar flex flex-col">
      <div className="p-6 border-b border-secondary-200/20 dark:border-secondary-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-secondary-900 dark:text-white">BudgetWise</h1>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">AI Finance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-secondary-200/20 dark:border-secondary-700/30">
        <button
          onClick={toggleTheme}
          className="nav-link w-full justify-between"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </button>

        <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary-50/50 dark:bg-secondary-800/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
            {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary-900 dark:text-white truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="nav-link w-full mt-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
