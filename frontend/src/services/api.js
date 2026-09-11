import {
  cacheTransactions,
  getCachedTransactions,
  cacheGroups,
  getCachedGroups,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  clearSyncQueue
} from '../db/indexdb';
import { generateTimestampId } from '../utils/formatters';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase ? `${rawApiBase.replace(/\/+$/, '')}/api` : '/api';

export const api = {
  async clearQueue() {
    await clearSyncQueue();
  },
  // Fetch initial data (Online with IndexedDB cache fallback)
  async getData() {
    try {
      const response = await fetch(`${API_BASE}/data`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();

      // Update IndexedDB cache
      if (data.transactions) {
        await cacheTransactions(data.transactions);
      }
      if (data.all_groups || data.groups) {
        await cacheGroups(data.all_groups || data.groups);
      }

      return {
        transactions: data.transactions || [],
        groups: data.groups || [],
        all_groups: data.all_groups || data.groups || [],
        categories: data.categories || [],
        storage_mode: data.storage_mode || 'google_sheets',
        isOffline: false
      };
    } catch (err) {
      console.warn('[API] Fetch failed, falling back to local:', err.message);
      const [cachedTx, cachedGrp] = await Promise.all([
        getCachedTransactions(),
        getCachedGroups()
      ]);
      return {
        transactions: cachedTx,
        groups: cachedGrp.filter(g => g.status === 'active'),
        all_groups: cachedGrp,
        categories: [],
        storage_mode: 'local_fallback',
        isOffline: true
      };
    }
  },

  // Create Transaction
  async createTransaction(txData) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txData)
        });
        if (response.ok) {
          const resData = await response.json();
          return { success: true, transaction: resData.transaction, synced: true };
        }
      } catch (err) {
        console.warn('[API] POST failed, queueing offline:', err.message);
      }
    }

    // Offline fallback
    const offlineTx = {
      ...txData,
      id: txData.id || generateTimestampId(),
      created_at: new Date().toISOString(),
      is_deleted: false,
      _is_pending_sync: true
    };

    // Update local cache
    const currentCached = await getCachedTransactions();
    await cacheTransactions([offlineTx, ...currentCached]);

    // Queue for sync
    await addToSyncQueue({
      type: 'CREATE_TRANSACTION',
      payload: offlineTx
    });

    return { success: true, transaction: offlineTx, synced: false };
  },

  // Update Transaction
  async updateTransaction(id, updates) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          const resData = await response.json();
          return { success: true, transaction: resData.transaction, synced: true };
        }
      } catch (err) {
        console.warn('[API] PUT failed, queueing offline:', err.message);
      }
    }

    // Offline update in IndexedDB
    const cached = await getCachedTransactions();
    const updatedList = cached.map(t => t.id === id ? { ...t, ...updates, _is_pending_sync: true } : t);
    await cacheTransactions(updatedList);

    await addToSyncQueue({
      type: 'UPDATE_TRANSACTION',
      transactionId: id,
      payload: updates
    });

    return { success: true, transaction: { id, ...updates }, synced: false };
  },

  // Delete Transaction
  async deleteTransaction(id) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          return { success: true, synced: true };
        }
      } catch (err) {
        console.warn('[API] DELETE failed, queueing offline:', err.message);
      }
    }

    // Offline soft delete in IndexedDB
    const cached = await getCachedTransactions();
    const updatedList = cached.filter(t => t.id !== id);
    await cacheTransactions(updatedList);

    await addToSyncQueue({
      type: 'DELETE_TRANSACTION',
      transactionId: id
    });

    return { success: true, synced: false };
  },

  // Create Group
  async createGroup(groupName) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_name: groupName })
        });
        if (response.ok) {
          const resData = await response.json();
          return { success: true, group: resData.group, synced: true };
        }
      } catch (err) {
        console.warn('[API] Group POST failed, queueing offline:', err.message);
      }
    }

    // Offline group creation
    const offlineGroup = {
      group_id: `grp_local_${Date.now()}`,
      group_name: groupName,
      status: 'active',
      created_at: new Date().toISOString(),
      _is_pending_sync: true
    };

    const cached = await getCachedGroups();
    await cacheGroups([...cached, offlineGroup]);

    await addToSyncQueue({
      type: 'CREATE_GROUP',
      payload: { group_name: groupName, group_id: offlineGroup.group_id }
    });

    return { success: true, group: offlineGroup, synced: false };
  },

  // Archive Group
  async archiveGroup(groupId) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/groups/${groupId}/archive`, {
          method: 'PUT'
        });
        if (response.ok) {
          return { success: true, synced: true };
        }
      } catch (err) {
        console.warn('[API] Group archive failed, queueing offline:', err.message);
      }
    }

    const cached = await getCachedGroups();
    const updated = cached.map(g => g.group_id === groupId ? { ...g, status: 'archived' } : g);
    await cacheGroups(updated);

    await addToSyncQueue({
      type: 'ARCHIVE_GROUP',
      groupId
    });

    return { success: true, synced: false };
  },

  // Create Category
  async createCategory(catData) {
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      if (response.ok) {
        const resData = await response.json();
        return { success: true, category: resData.category };
      }
      const err = await response.json();
      throw new Error(err.detail || err.error || 'Failed to create category');
    } catch (err) {
      console.error('[API] createCategory error:', err);
      throw err;
    }
  },

  // Sync Queue Runner
  async syncPendingChanges(onProgress) {
    const queue = await getSyncQueue();
    if (!queue || queue.length === 0) return { processed: 0, errors: 0, details: [] };

    let processed = 0;
    let errors = 0;
    const details = [];

    for (const item of queue) {
      try {
        let res = null;
        if (item.type === 'CREATE_TRANSACTION') {
          // Clean payload to ensure strict FastAPI Pydantic schema validation
          const payload = {
            id: item.payload.id || generateTimestampId(),
            amount: Number(item.payload.amount),
            description: String(item.payload.description || '').trim(),
            date: item.payload.date ? String(item.payload.date).split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0],
            category: String(item.payload.category || 'Other').trim(),
            payment_mode: String(item.payload.payment_mode || 'UPI').trim(),
            group_id: String(item.payload.group_id || '').trim(),
            created_at: item.payload.created_at || new Date().toISOString()
          };
          res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else if (item.type === 'UPDATE_TRANSACTION') {
          const payload = { ...item.payload };
          if (payload.amount !== undefined) payload.amount = Number(payload.amount);
          res = await fetch(`${API_BASE}/transactions/${item.transactionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else if (item.type === 'DELETE_TRANSACTION') {
          res = await fetch(`${API_BASE}/transactions/${item.transactionId}`, {
            method: 'DELETE'
          });
        } else if (item.type === 'CREATE_GROUP') {
          res = await fetch(`${API_BASE}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: String(item.payload.group_name || '').trim() })
          });
        } else if (item.type === 'ARCHIVE_GROUP') {
          res = await fetch(`${API_BASE}/groups/${item.groupId}/archive`, {
            method: 'PUT'
          });
        }

        if (res && res.ok) {
          await removeSyncQueueItem(item.queue_id);
          processed++;
        } else {
          errors++;
          let errText = 'Server error';
          try {
            const errJson = await res.json();
            errText = errJson.detail || JSON.stringify(errJson);
          } catch (_) {
            errText = res ? `${res.status} ${res.statusText}` : 'No response';
          }
          console.error(`[Sync Error] Item ${item.queue_id} (${item.type}):`, errText);
          details.push(`Item ${item.type}: ${errText}`);
        }
      } catch (e) {
        errors++;
        console.error('[API Sync Network Error]:', e);
        details.push(e.message || 'Network unreachable');
      }

      if (onProgress) {
        onProgress(processed, queue.length);
      }
    }

    return { processed, errors, details };
  }
};
