import React from 'react';
import { TrendingDown, PiggyBank, Vault } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function KPIBanner({ transactions }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current month transactions
  const currentMonthTx = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date.replace(' ', 'T'));
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Savings = category 'Savings' (case-insensitive)
  const isSavingsTx = (t) => (t.category || '').toLowerCase() === 'savings';

  const monthSavingsTx   = currentMonthTx.filter(isSavingsTx);
  const monthExpenseTx   = currentMonthTx.filter(t => !isSavingsTx(t));
  const allSavingsTx     = transactions.filter(isSavingsTx);

  const totalMonthExpense  = monthExpenseTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalMonthSavings  = monthSavingsTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalOverallSavings = allSavingsTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-3">
      {/* Row 1: This Month Expense + This Month Savings */}
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
            {formatCurrency(totalMonthExpense)}
          </div>
          <span className="text-[11px] text-rose-400 font-medium">
            {monthExpenseTx.length} expense{monthExpenseTx.length !== 1 ? 's' : ''}
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
          <div className={`text-2xl font-extrabold tracking-tight leading-none mb-1 ${totalMonthSavings > 0 ? 'text-teal-300' : 'text-slate-500'}`}>
            {formatCurrency(totalMonthSavings)}
          </div>
          <span className="text-[11px] text-teal-500 font-medium">
            {monthSavingsTx.length} this month
          </span>
        </div>
      </div>

      {/* Row 2: Overall Savings (all-time) */}
      <div className="glass-card p-4 rounded-2xl border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Savings</p>
              <p className="text-[10px] text-slate-500 mt-0.5">All time · {allSavingsTx.length} entr{allSavingsTx.length !== 1 ? 'ies' : 'y'}</p>
            </div>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight ${totalOverallSavings > 0 ? 'text-teal-300' : 'text-slate-500'}`}>
            {formatCurrency(totalOverallSavings)}
          </div>
        </div>
      </div>
    </div>
  );
}
