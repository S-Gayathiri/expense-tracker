import React from 'react';
import { TrendingDown, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function KPIBanner({ transactions }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Only current month transactions
  const currentMonthTx = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date.replace(' ', 'T'));
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Savings = category is 'Savings' (case-insensitive)
  const savingsTx = currentMonthTx.filter(
    t => (t.category || '').toLowerCase() === 'savings'
  );

  // Expense = everything else
  const expenseTx = currentMonthTx.filter(
    t => (t.category || '').toLowerCase() !== 'savings'
  );

  const totalExpense = expenseTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalSavings = savingsTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* This Month Expense */}
      <div className="glass-card p-4 rounded-2xl border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            This Month
          </span>
          <div className="w-7 h-7 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight leading-none mb-1">
          {formatCurrency(totalExpense)}
        </div>
        <span className="text-[11px] text-rose-400 font-medium">
          {expenseTx.length} expense{expenseTx.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* This Month Savings */}
      <div className="glass-card p-4 rounded-2xl border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Savings
          </span>
          <div className="w-7 h-7 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl font-extrabold tracking-tight leading-none mb-1 ${totalSavings > 0 ? 'text-teal-300' : 'text-slate-500'}`}>
          {formatCurrency(totalSavings)}
        </div>
        <span className="text-[11px] text-teal-500 font-medium">
          {savingsTx.length} saving{savingsTx.length !== 1 ? 's' : ''} this month
        </span>
      </div>
    </div>
  );
}
