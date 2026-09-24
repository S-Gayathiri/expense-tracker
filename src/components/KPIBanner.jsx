import React from 'react';
import { IndianRupee, Calendar, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function KPIBanner({ transactions }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTx = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date.replace(' ', 'T'));
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const expenseTx = currentMonthTx.filter(t => t.transaction_type !== 'income');
  const incomeTx = currentMonthTx.filter(t => t.transaction_type === 'income');

  const totalMonthlyExpense = expenseTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalMonthlyIncome = incomeTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netBalance = totalMonthlyIncome - totalMonthlyExpense;

  const currentDay = Math.max(1, now.getDate());
  const dailyAverage = totalMonthlyExpense / currentDay;

  // All-time net
  const allTimeExpense = transactions.filter(t => t.transaction_type !== 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const allTimeIncome = transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const allTimeNet = allTimeIncome - allTimeExpense;

  return (
    <div className="space-y-3">
      {/* Row 1: Expense & Income this month */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly Expense */}
        <div className="glass-card p-3.5 rounded-2xl border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Spent</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-white tracking-tight">
            {formatCurrency(totalMonthlyExpense)}
          </div>
          <span className="text-[10px] text-rose-400 font-medium">
            {expenseTx.length} expense{expenseTx.length !== 1 ? 's' : ''} this month
          </span>
        </div>

        {/* Monthly Income */}
        <div className="glass-card p-3.5 rounded-2xl border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Earned</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-white tracking-tight">
            {formatCurrency(totalMonthlyIncome)}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">
            {incomeTx.length} income{incomeTx.length !== 1 ? 's' : ''} this month
          </span>
        </div>
      </div>

      {/* Row 2: Net Balance & Daily Avg */}
      <div className="grid grid-cols-2 gap-3">
        {/* Net Balance (this month) */}
        <div className={`glass-card p-3.5 rounded-2xl border-slate-800 relative overflow-hidden group`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl pointer-events-none ${netBalance >= 0 ? 'bg-teal-500/10' : 'bg-orange-500/10'}`} />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Net Balance</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${netBalance >= 0 ? 'bg-teal-500/15 text-teal-400' : 'bg-orange-500/15 text-orange-400'}`}>
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-xl font-extrabold tracking-tight ${netBalance >= 0 ? 'text-teal-300' : 'text-orange-300'}`}>
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">this month</span>
        </div>

        {/* Daily Average (expenses) */}
        <div className="glass-card p-3.5 rounded-2xl border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Daily Avg</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-white tracking-tight">
            {formatCurrency(dailyAverage)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Day {currentDay} of {new Date(currentYear, currentMonth + 1, 0).getDate()}
          </span>
        </div>
      </div>

      {/* Row 3: All-time net */}
      <div className="glass-card p-3 rounded-2xl border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">All-Time Net</span>
          </div>
          <div className="text-right">
            <span className={`text-base font-extrabold tracking-tight ${allTimeNet >= 0 ? 'text-teal-300' : 'text-orange-300'}`}>
              {allTimeNet >= 0 ? '+' : ''}{formatCurrency(allTimeNet)}
            </span>
            <div className="text-[10px] text-slate-500">
              {transactions.length} transactions · {formatCurrency(allTimeIncome)} in / {formatCurrency(allTimeExpense)} out
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
