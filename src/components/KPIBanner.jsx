import React from 'react';
import { TrendingDown, PiggyBank, Vault, ArrowUpFromLine } from 'lucide-react';
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

  // Deposit: category = 'Savings'
  const isSavingsDeposit = (t) => (t.category || '').toLowerCase() === 'savings';
  // Withdrawal: payment_mode = 'From Savings'
  const isSavingsWithdrawal = (t) => (t.payment_mode || '').toLowerCase() === 'from savings';

  // This month
  const monthSavingsTx  = currentMonthTx.filter(isSavingsDeposit);
  const monthExpenseTx  = currentMonthTx.filter(t => !isSavingsDeposit(t));

  const totalMonthExpense  = monthExpenseTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalMonthSavings  = monthSavingsTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // All-time savings balance
  const allTimeSaved    = transactions.filter(isSavingsDeposit).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const allTimeUsed     = transactions.filter(isSavingsWithdrawal).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const overallSavings  = allTimeSaved - allTimeUsed;

  return (
    <div className="space-y-3">
      {/* Row 1: This Month Expense + This Month Savings */}
      <div className="grid grid-cols-2 gap-3">
        {/* This Month Expense */}
        <div className="glass-card p-4 rounded-2xl border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">This Month</span>
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
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Savings</span>
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

      {/* Row 2: Overall Savings balance */}
      <div className={`glass-card p-4 rounded-2xl relative overflow-hidden ${overallSavings < 0 ? 'border border-orange-500/30' : 'border-slate-800'}`}>
        <div className={`absolute inset-0 pointer-events-none rounded-2xl ${overallSavings >= 0 ? 'bg-gradient-to-r from-teal-500/5 to-emerald-500/5' : 'bg-gradient-to-r from-orange-500/5 to-rose-500/5'}`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${overallSavings >= 0 ? 'bg-teal-500/20 text-teal-400' : 'bg-orange-500/20 text-orange-400'}`}>
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Savings</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-teal-500 flex items-center gap-0.5">
                  <PiggyBank className="w-2.5 h-2.5" /> {formatCurrency(allTimeSaved)} saved
                </span>
                {allTimeUsed > 0 && (
                  <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                    <ArrowUpFromLine className="w-2.5 h-2.5" /> −{formatCurrency(allTimeUsed)} used
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={`text-right`}>
            <div className={`text-2xl font-extrabold tracking-tight ${overallSavings > 0 ? 'text-teal-300' : overallSavings < 0 ? 'text-orange-300' : 'text-slate-500'}`}>
              {formatCurrency(Math.abs(overallSavings))}
            </div>
            {overallSavings < 0 && (
              <div className="text-[10px] text-orange-400 font-medium">over-withdrawn</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
