import React, { useState } from 'react';
import { RefreshCw, AlertCircle, Clock, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { getCategoryConfig } from '../utils/constants';
import { FREQUENCIES, daysUntilDue, dueLabel } from '../utils/recurring';

function DueBadge({ days }) {
  if (days === null) return null;
  if (days < 0)
    return <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Overdue</span>;
  if (days === 0)
    return <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">Today</span>;
  if (days <= 3)
    return <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Soon</span>;
  return <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">{dueLabel(days)}</span>;
}

export default function RecurringSection({ transactions = [], customCategories = [], onLogRecurring }) {
  const [paidIds, setPaidIds] = useState(new Set());

  // Build unique recurring templates — one per description+category combo, most recent entry wins
  const templates = (() => {
    const map = {};
    transactions
      .filter(t => t.recurring === true || t.recurring === 'true')
      .forEach(t => {
        const key = `${(t.description || '').toLowerCase()}__${t.category}`;
        if (!map[key] || (t.date || '') > (map[key].date || '')) {
          map[key] = t;
        }
      });

    return Object.values(map).map(t => {
      const { default: _, ...rest } = t;
      const freq = t.frequency || 'monthly';
      // Compute next due from last logged date
      const d = new Date((t.date || '').split('T')[0] + 'T00:00:00');
      if (freq === 'weekly') d.setDate(d.getDate() + 7);
      else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
      else d.setMonth(d.getMonth() + 1);
      const pad = n => String(n).padStart(2, '0');
      const nextDue = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return { ...t, nextDue, freq };
    }).sort((a, b) => (a.nextDue || '').localeCompare(b.nextDue || ''));
  })();

  const handleMarkPaid = async (template) => {
    setPaidIds(prev => new Set([...prev, template.id]));
    try {
      await onLogRecurring(template);
    } catch (e) {
      setPaidIds(prev => { const s = new Set(prev); s.delete(template.id); return s; });
    }
  };

  if (templates.length === 0) {
    return (
      <div className="glass-card rounded-2xl border-slate-800 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
          <RefreshCw className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">No Recurring Expenses</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          When adding an expense, toggle <strong className="text-slate-300">Recurring</strong> to track it here — rent, EMIs, subscriptions, etc.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map(template => {
        const days = daysUntilDue(template.nextDue);
        const catConfig = getCategoryConfig(template.category, customCategories);
        const freqLabel = FREQUENCIES.find(f => f.id === template.freq)?.label || 'Monthly';
        const isMarkedPaid = paidIds.has(template.id);
        const isUrgent = days !== null && days <= 3;

        return (
          <div
            key={template.id}
            className={`glass-card rounded-2xl border p-3.5 transition-all ${
              isUrgent ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              {/* Left: Category icon + details */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: catConfig.bg, color: catConfig.color }}
                >
                  <RefreshCw className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-white truncate">{template.description}</h4>
                    <DueBadge days={days} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                    <span
                      className="px-1.5 py-0.5 rounded-md font-medium"
                      style={{ backgroundColor: catConfig.bg, color: catConfig.text }}
                    >
                      {template.category}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {freqLabel}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span>
                      Due {new Date(template.nextDue + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Amount + pay button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-base font-extrabold text-white">{formatCurrency(template.amount)}</span>
                <button
                  onClick={() => handleMarkPaid(template)}
                  disabled={isMarkedPaid}
                  title="Log this recurring expense now"
                  className={`p-1.5 rounded-xl transition-all active:scale-90 ${
                    isMarkedPaid
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/40'
                  }`}
                >
                  {isMarkedPaid
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <Plus className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-center text-[10px] text-slate-600 pt-1">
        Tap <Plus className="w-2.5 h-2.5 inline" /> to instantly log a recurring expense for today
      </p>
    </div>
  );
}
