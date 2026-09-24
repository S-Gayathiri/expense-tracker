import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getIntensityStyle(net, maxAbsNet) {
  if (maxAbsNet === 0) return { bg: 'bg-slate-800/60', text: 'text-slate-500' };
  const ratio = Math.abs(net) / maxAbsNet;
  if (net === 0) return { bg: 'bg-slate-800/60', text: 'text-slate-500' };
  if (net > 0) {
    // income day — teal/emerald spectrum
    if (ratio > 0.75) return { bg: 'bg-emerald-500/80', text: 'text-emerald-950' };
    if (ratio > 0.45) return { bg: 'bg-emerald-500/50', text: 'text-emerald-300' };
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
  } else {
    // expense day — rose spectrum
    if (ratio > 0.75) return { bg: 'bg-rose-500/80', text: 'text-rose-950' };
    if (ratio > 0.45) return { bg: 'bg-rose-500/50', text: 'text-rose-300' };
    return { bg: 'bg-rose-500/20', text: 'text-rose-400' };
  }
}

export default function CalendarView({ transactions = [] }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(null); // 'YYYY-MM-DD'

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Build a map: dateStr -> { income, expense, net, txs }
  const dayDataMap = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (!t.date) return;
      const dateStr = t.date.split('T')[0].split(' ')[0];
      if (!map[dateStr]) map[dateStr] = { income: 0, expense: 0, net: 0, txs: [] };
      const amt = Number(t.amount) || 0;
      const isIncome = t.transaction_type === 'income';
      if (isIncome) {
        map[dateStr].income += amt;
        map[dateStr].net += amt;
      } else {
        map[dateStr].expense += amt;
        map[dateStr].net -= amt;
      }
      map[dateStr].txs.push(t);
    });
    return map;
  }, [transactions]);

  // Calendar grid data for current month
  const { calendarDays, maxAbsNet } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    let maxAbsNet = 0;
    const days = [];

    // Padding cells (empty) before first day
    for (let i = 0; i < firstDay; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${viewYear}-${mm}-${dd}`;
      const data = dayDataMap[dateStr] || null;
      if (data && Math.abs(data.net) > maxAbsNet) maxAbsNet = Math.abs(data.net);
      days.push({ day: d, dateStr, data });
    }

    return { calendarDays: days, maxAbsNet };
  }, [viewYear, viewMonth, dayDataMap]);

  // Monthly summary
  const monthSummary = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    let income = 0, expense = 0;
    Object.entries(dayDataMap).forEach(([dateStr, data]) => {
      if (dateStr.startsWith(prefix)) {
        income += data.income;
        expense += data.expense;
      }
    });
    return { income, expense, net: income - expense };
  }, [viewYear, viewMonth, dayDataMap]);

  // Selected day transactions
  const selectedDayData = selectedDay ? dayDataMap[selectedDay] : null;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Month Navigator */}
      <div className="glass-card rounded-2xl border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-base font-bold text-white">{MONTHS[viewMonth]} {viewYear}</h2>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Monthly KPI Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-0.5">Income</div>
            <div className="text-sm font-extrabold text-emerald-300">{formatCurrency(monthSummary.income)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <div className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider mb-0.5">Expense</div>
            <div className="text-sm font-extrabold text-rose-300">{formatCurrency(monthSummary.expense)}</div>
          </div>
          <div className={`p-2.5 rounded-xl border text-center ${monthSummary.net >= 0 ? 'bg-teal-500/10 border-teal-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
            <div className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${monthSummary.net >= 0 ? 'text-teal-400' : 'text-orange-400'}`}>Net</div>
            <div className={`text-sm font-extrabold ${monthSummary.net >= 0 ? 'text-teal-300' : 'text-orange-300'}`}>
              {monthSummary.net >= 0 ? '+' : ''}{formatCurrency(monthSummary.net)}
            </div>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-500 uppercase py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, i) => {
            if (!cell) {
              return <div key={`empty-${i}`} />;
            }
            const { day, dateStr, data } = cell;
            const style = data ? getIntensityStyle(data.net, maxAbsNet) : { bg: 'bg-slate-800/30', text: 'text-slate-600' };
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all active:scale-90 relative
                  ${style.bg} ${style.text}
                  ${isToday ? 'ring-2 ring-white/30' : ''}
                  ${isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:scale-105'}
                `}
              >
                <span className={`leading-none ${isToday ? 'text-white' : ''}`}>{day}</span>
                {data && (
                  <span className="text-[7px] leading-none mt-0.5 opacity-80">
                    {data.net > 0 ? '↑' : data.net < 0 ? '↓' : '·'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-rose-500/70" />
            <span>Expense</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-700" />
            <span>No activity</span>
          </div>
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDay && selectedDayData && (
        <div className="glass-card rounded-2xl border-slate-800 p-4 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="flex gap-2 mt-1 text-[11px]">
                {selectedDayData.income > 0 && (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> {formatCurrency(selectedDayData.income)}
                  </span>
                )}
                {selectedDayData.expense > 0 && (
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" /> {formatCurrency(selectedDayData.expense)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>

          <div className="space-y-2">
            {selectedDayData.txs.map(t => {
              const isIncome = t.transaction_type === 'income';
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                      {isIncome
                        ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{t.description}</p>
                      <p className="text-[10px] text-slate-400">{t.category} · {t.payment_mode}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ml-2 flex-shrink-0 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDay && !selectedDayData && (
        <div className="glass-card rounded-2xl border-slate-800 p-4 text-center text-slate-500 text-sm animate-in fade-in duration-150">
          No transactions on {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
        </div>
      )}
    </div>
  );
}
