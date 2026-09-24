import React, { useState, useMemo } from 'react';
import {
  Sparkles, X, ChevronRight, ChevronLeft, TrendingDown, PiggyBank,
  Award, Trophy, Calendar, CreditCard, PieChart, ArrowRight, Share2
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { getCategoryConfig } from '../utils/constants';

export default function YearInReviewModal({ transactions = [], customCategories = [], onClose }) {
  // Extract all available years from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    transactions.forEach(t => {
      if (t.date) {
        const yr = new Date(t.date.replace(' ', 'T')).getFullYear();
        if (!isNaN(yr)) yearsSet.add(yr);
      }
    });
    const arr = Array.from(yearsSet).sort((a, b) => b - a);
    return arr.length > 0 ? arr : [new Date().getFullYear()];
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState('story'); // 'story' | 'summary'

  // Calculate year stats
  const stats = useMemo(() => {
    const yearTx = transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date.replace(' ', 'T'));
      return d.getFullYear() === selectedYear;
    });

    const isSavings = (t) => (t.category || '').toLowerCase() === 'savings';
    const expenseTx = yearTx.filter(t => !isSavings(t));
    const savingsTx = yearTx.filter(isSavings);

    const totalExpense = expenseTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalSavings = savingsTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalTransactions = yearTx.length;

    // Category breakdown
    const catMap = {};
    expenseTx.forEach(t => {
      const c = t.category || 'Other';
      catMap[c] = (catMap[c] || 0) + (Number(t.amount) || 0);
    });

    const sortedCats = Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategory = sortedCats[0] || { name: 'None', amount: 0, pct: 0 };

    // Payment mode breakdown
    const modeMap = {};
    expenseTx.forEach(t => {
      const m = t.payment_mode || 'UPI';
      modeMap[m] = (modeMap[m] || 0) + (Number(t.amount) || 0);
    });

    const sortedModes = Object.entries(modeMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const topPaymentMode = sortedModes[0] || { name: 'UPI', amount: 0 };

    // Highest single transaction
    const biggestExpense = [...expenseTx].sort((a, b) => Number(b.amount) - Number(a.amount))[0] || null;

    // Monthly breakdown
    const monthlyExpense = {};
    const monthlySavings = {};
    for (let m = 0; m < 12; m++) {
      monthlyExpense[m] = 0;
      monthlySavings[m] = 0;
    }

    yearTx.forEach(t => {
      const d = new Date(t.date.replace(' ', 'T'));
      const m = d.getMonth();
      const amt = Number(t.amount) || 0;
      if (isSavings(t)) {
        monthlySavings[m] = (monthlySavings[m] || 0) + amt;
      } else {
        monthlyExpense[m] = (monthlyExpense[m] || 0) + amt;
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let peakExpenseMonth = { name: 'N/A', amount: 0 };
    let peakSavingsMonth = { name: 'N/A', amount: 0 };

    Object.entries(monthlyExpense).forEach(([m, amt]) => {
      if (amt > peakExpenseMonth.amount) {
        peakExpenseMonth = { name: monthNames[Number(m)], amount: amt };
      }
    });

    Object.entries(monthlySavings).forEach(([m, amt]) => {
      if (amt > peakSavingsMonth.amount) {
        peakSavingsMonth = { name: monthNames[Number(m)], amount: amt };
      }
    });

    // Savings rate
    const totalCash = totalExpense + totalSavings;
    const savingsRate = totalCash > 0 ? Math.round((totalSavings / totalCash) * 100) : 0;

    // Financial Persona Badge
    let persona = {
      title: 'Mindful Balancer',
      emoji: '⚖️',
      desc: 'You maintain a steady, disciplined grip on your finances with consistent tracking.',
      color: 'from-emerald-500 to-teal-600'
    };

    if (savingsRate >= 35) {
      persona = {
        title: 'Wealth Champion',
        emoji: '👑',
        desc: `You saved a massive ${savingsRate}% of your total cash flow! Outstanding wealth discipline.`,
        color: 'from-amber-400 to-orange-500'
      };
    } else if (topCategory.name.toLowerCase().includes('food')) {
      persona = {
        title: 'Food Connoisseur',
        emoji: '🍔',
        desc: 'Good food, dining, and treats were your biggest passion this year.',
        color: 'from-orange-500 to-rose-500'
      };
    } else if (topCategory.name.toLowerCase().includes('travel')) {
      persona = {
        title: 'Globe Trotter',
        emoji: '✈️',
        desc: 'Experiences and travel journeys made up the majority of your memorable spending.',
        color: 'from-cyan-500 to-blue-600'
      };
    } else if (topCategory.name.toLowerCase().includes('shopping')) {
      persona = {
        title: 'Lifestyle Trendsetter',
        emoji: '🛍️',
        desc: 'You invested in your wardrobe, personal style, and top shopping picks.',
        color: 'from-purple-500 to-indigo-600'
      };
    }

    return {
      yearTx,
      totalExpense,
      totalSavings,
      totalTransactions,
      sortedCats,
      topCategory,
      topPaymentMode,
      biggestExpense,
      peakExpenseMonth,
      peakSavingsMonth,
      savingsRate,
      persona
    };
  }, [transactions, selectedYear]);

  const totalSlides = 5;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(s => s + 1);
    } else {
      setViewMode('summary');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(s => s - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Floating Controls */}
        <div className="p-4 pb-2 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{selectedYear} Wrapped</span>
            </span>

            {/* Year Selector */}
            {availableYears.length > 1 && (
              <select
                value={selectedYear}
                onChange={e => {
                  setSelectedYear(Number(e.target.value));
                  setCurrentSlide(0);
                }}
                className="bg-slate-800 text-[11px] font-bold text-slate-300 rounded-lg px-2 py-0.5 border border-slate-700 focus:outline-none"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(v => v === 'story' ? 'summary' : 'story')}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            >
              {viewMode === 'story' ? '📊 Summary Card' : '✨ Story Mode'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Story Mode */}
        {viewMode === 'story' && (
          <div className="flex-1 flex flex-col p-4 pt-1 justify-between overflow-y-auto">
            {/* Story Segments Progress Bars */}
            <div className="flex gap-1.5 mb-4">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <div key={idx} className="h-1 flex-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full bg-amber-400 transition-all duration-300 ${
                      idx < currentSlide ? 'w-full' : idx === currentSlide ? 'w-full animate-pulse' : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Slide 0: The Grand Numbers */}
            {currentSlide === 0 && (
              <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-orange-500/20">
                  🎉
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Your Year In Review</p>
                  <h2 className="text-2xl font-black text-white mt-1">Here is what {selectedYear} looked like!</h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="glass-card p-3.5 rounded-2xl border-slate-800 text-left bg-gradient-to-b from-rose-500/10 to-transparent">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Spent</span>
                    <p className="text-lg font-black text-rose-400 mt-0.5">{formatCurrency(stats.totalExpense)}</p>
                    <span className="text-[10px] text-slate-500">{stats.yearTx.length} records</span>
                  </div>

                  <div className="glass-card p-3.5 rounded-2xl border-slate-800 text-left bg-gradient-to-b from-teal-500/10 to-transparent">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Saved</span>
                    <p className="text-lg font-black text-teal-300 mt-0.5">{formatCurrency(stats.totalSavings)}</p>
                    <span className="text-[10px] text-teal-500 font-medium">{stats.savingsRate}% savings rate</span>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 1: Top Category */}
            {currentSlide === 1 && (
              <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center text-3xl mx-auto shadow-lg">
                  🏆
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Your #1 Spending Habit</p>
                  <h2 className="text-3xl font-black text-white mt-1">{stats.topCategory.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    You spent <strong className="text-white">{formatCurrency(stats.topCategory.amount)}</strong> here ({stats.topCategory.pct}% of all expenses).
                  </p>
                </div>

                {/* Other top categories list */}
                <div className="glass-card p-3 rounded-2xl border-slate-800 text-left space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Category Breakdown</span>
                  {stats.sortedCats.slice(0, 3).map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">#{idx + 1} {cat.name}</span>
                      <span className="font-bold text-white">{formatCurrency(cat.amount)} ({cat.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 2: Savings Champion */}
            {currentSlide === 2 && (
              <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-400 to-emerald-500 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-teal-500/20">
                  🐷
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Savings Breakdown</p>
                  <h2 className="text-3xl font-black text-white mt-1">{formatCurrency(stats.totalSavings)}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Saved across all {selectedYear} deposits!
                  </p>
                </div>

                <div className="glass-card p-4 rounded-2xl border-teal-500/20 bg-teal-500/5 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">🌟 Best Savings Month:</span>
                    <strong className="text-teal-300 font-bold">{stats.peakSavingsMonth.name} ({formatCurrency(stats.peakSavingsMonth.amount)})</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">🔥 Peak Spending Month:</span>
                    <strong className="text-rose-400 font-bold">{stats.peakExpenseMonth.name} ({formatCurrency(stats.peakExpenseMonth.amount)})</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Biggest Purchase & Favorite Payment Mode */}
            {currentSlide === 3 && (
              <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-3xl mx-auto shadow-lg">
                  💳
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">How You Spent It</p>
                  <h2 className="text-2xl font-black text-white mt-1">Payment & Top Bill</h2>
                </div>

                <div className="space-y-2 text-left">
                  <div className="glass-card p-3.5 rounded-2xl border-slate-800">
                    <span className="text-[10px] text-indigo-400 uppercase font-bold">Go-To Payment Mode</span>
                    <p className="text-base font-extrabold text-white mt-0.5">{stats.topPaymentMode.name}</p>
                    <span className="text-[11px] text-slate-400">{formatCurrency(stats.topPaymentMode.amount)} paid via this method</span>
                  </div>

                  {stats.biggestExpense && (
                    <div className="glass-card p-3.5 rounded-2xl border-slate-800">
                      <span className="text-[10px] text-amber-400 uppercase font-bold">Single Biggest Expense</span>
                      <p className="text-base font-extrabold text-white mt-0.5">{stats.biggestExpense.description}</p>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>{stats.biggestExpense.category}</span>
                        <strong className="text-rose-400 font-bold">{formatCurrency(stats.biggestExpense.amount)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Slide 4: Financial Persona */}
            {currentSlide === 4 && (
              <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center text-4xl mx-auto shadow-xl">
                  {stats.persona.emoji}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Your {selectedYear} Badge</p>
                  <h2 className="text-2xl font-black text-white mt-1">{stats.persona.title}</h2>
                  <p className="text-xs text-slate-300 mt-2 px-4 leading-relaxed">
                    {stats.persona.desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium">
                  ✨ Ready to take on next year even stronger!
                </div>
              </div>
            )}

            {/* Bottom Story Navigation */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              <span className="text-[11px] text-slate-500 font-semibold">
                {currentSlide + 1} of {totalSlides}
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-md active:scale-95 transition"
              >
                <span>{currentSlide === totalSlides - 1 ? 'View Summary' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Card Mode (Full Infographic) */}
        {viewMode === 'summary' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {/* Main Header Banner */}
            <div className="glass-card p-4 rounded-2xl border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900 to-indigo-500/15 text-center">
              <span className="text-2xl mb-1 inline-block">{stats.persona.emoji}</span>
              <h3 className="text-base font-black text-white">{selectedYear} Financial Wrapped</h3>
              <p className="text-xs font-bold text-amber-300 mt-0.5">{stats.persona.title}</p>
            </div>

            {/* KPI 2x2 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-3 rounded-xl border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Spent</span>
                <p className="text-sm font-extrabold text-rose-400 mt-0.5">{formatCurrency(stats.totalExpense)}</p>
              </div>
              <div className="glass-card p-3 rounded-xl border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Saved</span>
                <p className="text-sm font-extrabold text-teal-300 mt-0.5">{formatCurrency(stats.totalSavings)}</p>
              </div>
              <div className="glass-card p-3 rounded-xl border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Top Category</span>
                <p className="text-xs font-bold text-white mt-0.5 truncate">{stats.topCategory.name}</p>
                <span className="text-[10px] text-slate-500">{formatCurrency(stats.topCategory.amount)}</span>
              </div>
              <div className="glass-card p-3 rounded-xl border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Top Mode</span>
                <p className="text-xs font-bold text-white mt-0.5 truncate">{stats.topPaymentMode.name}</p>
                <span className="text-[10px] text-slate-500">{formatCurrency(stats.topPaymentMode.amount)}</span>
              </div>
            </div>

            {/* Highlights List */}
            <div className="glass-card p-3.5 rounded-xl border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Transactions:</span>
                <strong className="text-white font-bold">{stats.totalTransactions} logged</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Peak Spending Month:</span>
                <strong className="text-rose-400 font-bold">{stats.peakExpenseMonth.name} ({formatCurrency(stats.peakExpenseMonth.amount)})</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Best Savings Month:</span>
                <strong className="text-teal-400 font-bold">{stats.peakSavingsMonth.name} ({formatCurrency(stats.peakSavingsMonth.amount)})</strong>
              </div>
              {stats.biggestExpense && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 truncate max-w-[140px]">Biggest Bill ({stats.biggestExpense.description}):</span>
                  <strong className="text-amber-300 font-bold">{formatCurrency(stats.biggestExpense.amount)}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentSlide(0);
                setViewMode('story');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center transition"
            >
              🔄 Replay Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
