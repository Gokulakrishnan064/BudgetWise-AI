import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div
        className={`fixed inset-0 z-50 lg:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="relative z-10 h-full w-64">
          <Sidebar />
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="lg:ml-64 min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-secondary-200/20 dark:border-secondary-700/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              <Menu className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
            </button>
            <h1 className="font-bold text-lg text-secondary-900 dark:text-white">BudgetWise AI</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
