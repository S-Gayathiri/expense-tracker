import React, { useState } from 'react';
import { TrendingDown, PiggyBank, Vault, ArrowUpFromLine, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatDateLabel } from '../utils/formatters';
import { getCategoryConfig } from '../utils/constants';

export default function KPIBanner({ transactions, customCategories = [] }) {
  const [showSavingsUsed, setShowSavingsUsed] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTx = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date.replace(' ', 'T'));
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Deposit: category = 'Savings'
  const isSavingsDeposit   = (t) => (t.category || '').toLowerCase() === 'savings';
  // Withdrawal: payment_mode = 'From Savings'
  const isSavingsWithdrawal = (t) => (t.payment_mode || '').toLowerCase() === 'from savings';

  // This month
  const monthSavingsTx = currentMonthTx.filter(isSavingsDeposit);
  const monthExpenseTx = currentMonthTx.filter(t => !isSavingsDeposit(t));

  const totalMonthExpense = monthExpenseTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalMonthSavings = monthSavingsTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // All-time savings balance
  const allTimeSaved       = transactions.filter(isSavingsDeposit).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const savingsUsedTx      = transactions.filter(isSavingsWithdrawal);
  const allTimeUsed        = savingsUsedTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const overallSavings     = allTimeSaved - allTimeUsed;

  // Sort withdrawals newest first
  const sortedWithdrawals = [...savingsUsedTx].sort((a, b) => {
    const da = a.date ? a.date.split('T')[0] : '';
    const db = b.date ? b.date.split('T')[0] : '';
    return db.localeCompare(da);
  });

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

      {/* Row 2: Overall Savings balance — tappable to expand withdrawals */}
      <div className={`glass-card rounded-2xl relative overflow-hidden ${overallSavings < 0 ? 'border border-orange-500/30' : 'border-slate-800'}`}>
        <div className={`absolute inset-0 pointer-events-none rounded-2xl ${overallSavings >= 0 ? 'bg-gradient-to-r from-teal-500/5 to-emerald-500/5' : 'bg-gradient-to-r from-orange-500/5 to-rose-500/5'}`} />

        {/* Header row — always visible, tap to toggle */}
        <button
          onClick={() => setShowSavingsUsed(v => !v)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <div className={`text-2xl font-extrabold tracking-tight ${overallSavings > 0 ? 'text-teal-300' : overallSavings < 0 ? 'text-orange-300' : 'text-slate-500'}`}>
                {formatCurrency(Math.abs(overallSavings))}
              </div>
              {overallSavings < 0 && (
                <div className="text-[10px] text-orange-400 font-medium">over-withdrawn</div>
              )}
            </div>
            {savingsUsedTx.length > 0 && (
              <div className="text-slate-500">
                {showSavingsUsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            )}
          </div>
        </button>

        {/* Expandable: Savings withdrawal list */}
        {showSavingsUsed && savingsUsedTx.length > 0 && (
          <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <ArrowUpFromLine className="w-3 h-3" /> Spent from Savings
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {sortedWithdrawals.map(t => {
              const catConfig = getCategoryConfig(t.category, customCategories);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/15"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Category dot */}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: catConfig.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{t.description}</p>
                      <p className="text-[10px] text-slate-400">{t.category} · {formatDateLabel(t.date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-orange-300 ml-2 flex-shrink-0">
                    −{formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })}

            {/* Total used */}
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-xs font-semibold">
              <span className="text-slate-400">{savingsUsedTx.length} withdrawal{savingsUsedTx.length !== 1 ? 's' : ''}</span>
              <span className="text-orange-400">−{formatCurrency(allTimeUsed)} total</span>
            </div>
          </div>
        )}

        {showSavingsUsed && savingsUsedTx.length === 0 && (
          <div className="px-4 pb-4 text-center text-slate-500 text-xs">
            No savings withdrawals yet
          </div>
        )}
      </div>
    </div>
  );
}
