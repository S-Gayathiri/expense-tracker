import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle2, TrendingUp, Sparkles, X, Edit2, Calendar, Award } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const STORAGE_KEY = 'pt_savings_goals';

const GOAL_ICONS = ['🎯', '🏖️', '🚗', '🏠', '💍', '📱', '🎓', '🏥', '🛡️', '💻', '✈️', '🎁'];

export default function SavingsGoalsManager({ overallSavings = 0, isSavingsHidden = false }) {
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: '1', title: 'Emergency Fund', target: 50000, icon: '🛡️', deadline: '', createdAt: new Date().toISOString() },
      { id: '2', title: 'Vacation / Trip', target: 20000, icon: '🏖️', deadline: '', createdAt: new Date().toISOString() }
    ];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch {}
  }, [goals]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setTarget('');
    setDeadline('');
    setSelectedIcon('🎯');
    setIsAdding(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingId(goal.id);
    setTitle(goal.title);
    setTarget(String(goal.target));
    setDeadline(goal.deadline || '');
    setSelectedIcon(goal.icon || '🎯');
    setIsAdding(true);
  };

  const handleSaveGoal = (e) => {
    e.preventDefault();
    const targetNum = parseFloat(target);
    if (!title.trim() || isNaN(targetNum) || targetNum <= 0) return;

    if (editingId) {
      setGoals(prev => prev.map(g => g.id === editingId ? {
        ...g,
        title: title.trim(),
        target: targetNum,
        deadline,
        icon: selectedIcon || '🎯'
      } : g));
    } else {
      const newGoal = {
        id: Date.now().toString(),
        title: title.trim(),
        target: targetNum,
        deadline,
        icon: selectedIcon || '🎯',
        createdAt: new Date().toISOString()
      };
      setGoals(prev => [...prev, newGoal]);
    }

    setTitle('');
    setTarget('');
    setDeadline('');
    setEditingId(null);
    setIsAdding(false);
  };

  const handleDeleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const totalTarget = goals.reduce((acc, g) => acc + (Number(g.target) || 0), 0);
  const currentSavings = Math.max(0, overallSavings);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((currentSavings / totalTarget) * 100)) : 0;

  const mask = (amt) => {
    if (isSavingsHidden) return '₹••••';
    return formatCurrency(amt);
  };

  return (
    <div className="space-y-4">
      {/* Header Summary Card */}
      <div className="glass-card p-4 rounded-2xl border-slate-800 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-slate-900 to-teal-500/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg">
              🎯
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Savings Milestones</h3>
              <p className="text-[11px] text-slate-400">Track target progress with your savings balance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={isAdding ? () => setIsAdding(false) : handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-glow-emerald transition active:scale-95"
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAdding ? 'Close' : 'New Goal'}</span>
          </button>
        </div>

        {/* Overall progress toward all goals */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Available Savings: <strong className="text-teal-400 font-semibold">{mask(currentSavings)}</strong></span>
            <span className="text-slate-400">Total Targets: <strong className="text-indigo-300 font-semibold">{mask(totalTarget)}</strong></span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span>{overallProgress}% of all milestones funded</span>
            <span>{goals.length} active goal{goals.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Add / Edit Goal Drawer Form */}
      {isAdding && (
        <form onSubmit={handleSaveGoal} className="glass-card p-4 rounded-2xl border-emerald-500/30 bg-emerald-500/5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {editingId ? 'Edit Milestone' : 'Add New Savings Goal'}
          </h4>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Goal Name *</label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund, Goa Trip, Gold Purchase"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Target Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Target Date (Optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Pick Icon</label>
            <div className="flex gap-1.5 flex-wrap">
              {GOAL_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${
                    selectedIcon === icon ? 'bg-emerald-500/30 border border-emerald-500 scale-110' : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !target}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition shadow-glow-emerald"
            >
              {editingId ? 'Update Goal' : 'Save Goal'}
            </button>
          </div>
        </form>
      )}

      {/* Goal Cards List */}
      <div className="space-y-3">
        {goals.map(goal => {
          const targetAmt = Number(goal.target) || 1;
          const pct = Math.min(100, Math.round((currentSavings / targetAmt) * 100));
          const isCompleted = currentSavings >= targetAmt;
          const remaining = Math.max(0, targetAmt - currentSavings);

          return (
            <div
              key={goal.id}
              className={`glass-card p-4 rounded-2xl border transition-all ${
                isCompleted ? 'border-teal-500/40 bg-teal-500/5' : 'border-slate-800 hover:border-slate-700/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    isCompleted ? 'bg-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.2)]' : 'bg-slate-800'
                  }`}>
                    {goal.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate">{goal.title}</h4>
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold flex items-center gap-1 border border-teal-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Reached
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {pct}% funded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                      <span>Target: <strong className="text-slate-200 font-semibold">{mask(targetAmt)}</strong></span>
                      {!isCompleted && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-teal-400">{mask(remaining)} left</span>
                        </>
                      )}
                      {goal.deadline && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(goal)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
                    title="Edit goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Status */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-gradient-to-r from-teal-400 to-emerald-400' : pct >= 70 ? 'bg-gradient-to-r from-indigo-500 to-teal-400' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs glass-card rounded-2xl border-slate-800">
            <Target className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>No savings milestones yet.</p>
            <p className="text-slate-400 mt-1">Tap <strong className="text-emerald-400">New Goal</strong> above to set your first target!</p>
          </div>
        )}
      </div>
    </div>
  );
}
