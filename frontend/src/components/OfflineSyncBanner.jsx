import React from 'react';
import { CloudOff, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function OfflineSyncBanner({
  isOnline,
  pendingSyncCount,
  onSyncNow,
  isSyncing,
  errorMessage,
  onClearError,
  onClearQueue
}) {
  if (isOnline && pendingSyncCount === 0 && !errorMessage) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Error notification if server rejected or failed */}
      {errorMessage && (
        <div className="p-3 rounded-2xl flex items-center justify-between bg-rose-500/10 border border-rose-500/30 text-rose-300">
          <div className="flex items-center space-x-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="text-xs break-words">{errorMessage}</span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {onClearQueue && (
              <button
                onClick={onClearQueue}
                className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-300 text-[11px] font-semibold transition"
                title="Discard failed pending changes"
              >
                Discard
              </button>
            )}
            {onClearError && (
              <button
                onClick={onClearError}
                className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-400"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending Sync / Offline Banner */}
      {(!isOnline || pendingSyncCount > 0) && (
        <div className={`p-3 rounded-2xl flex items-center justify-between transition-all border ${
          !isOnline
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center space-x-2.5">
            {!isOnline ? (
              <CloudOff className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <div className="text-xs">
              {!isOnline ? (
                <span>
                  <strong>You're Offline.</strong> Expenses will save to your device and sync when you reconnect.
                </span>
              ) : (
                <span>
                  <strong>{pendingSyncCount} pending change{pendingSyncCount > 1 ? 's' : ''}</strong> waiting to sync to Google Sheets.
                </span>
              )}
            </div>
          </div>

          {isOnline && pendingSyncCount > 0 && (
            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="ml-3 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-glow-emerald transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
