// src/hooks/useExpenses.js
import { useState, useEffect, useCallback } from 'react';
import { getMonthKey, generateId, getCurrentMonthKey } from '../utils/helpers';

const STORAGE_KEY = 'budget_panel_expenses_v1';
const API_URL = '/api/expenses';

/**
 * Load all expenses from localStorage.
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return {};
}

/**
 * Save all expenses to localStorage.
 */
function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Group flat array of expenses from MongoDB into { [monthKey]: [expenses...] }
 */
function groupExpensesByMonth(list) {
  const grouped = {};
  if (!Array.isArray(list)) return grouped;

  list.forEach(item => {
    const monthKey = getMonthKey(item.date);
    if (!monthKey) return;
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push({
      ...item,
      id: String(item.id || item._id),
      price: Number(item.price),
    });
  });

  // Sort expenses in each month by date descending
  Object.keys(grouped).forEach(m => {
    grouped[m].sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  return grouped;
}

export function useExpenses() {
  const [allExpenses, setAllExpenses] = useState(loadFromStorage);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline'

  // Fetch all expenses from MongoDB on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchExpenses() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();

        if (isMounted) {
          if (Array.isArray(data)) {
            // If DB is empty but localStorage has data, auto-migrate local data to MongoDB
            const localStored = loadFromStorage();
            const localList = Object.values(localStored).flat();

            if (data.length === 0 && localList.length > 0) {
              console.log('Migrating local expenses to MongoDB Atlas...');
              for (const item of localList) {
                try {
                  await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: item.name,
                      price: item.price,
                      date: item.date,
                      note: item.note || '',
                    }),
                  });
                } catch (migrationErr) {
                  console.error('Migration item failed:', migrationErr);
                }
              }
              // Re-fetch after migration
              const refetchRes = await fetch(API_URL);
              const refetchedData = await refetchRes.json();
              const grouped = groupExpensesByMonth(refetchedData);
              setAllExpenses(grouped);
              saveToStorage(grouped);
            } else {
              const grouped = groupExpensesByMonth(data);
              setAllExpenses(grouped);
              saveToStorage(grouped);
            }
          }
          setDbStatus('connected');
        }
      } catch (err) {
        console.warn('Backend / MongoDB unreachable, using local storage:', err.message);
        if (isMounted) {
          setDbStatus('offline');
        }
      }
    }

    fetchExpenses();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to storage when state changes
  useEffect(() => {
    saveToStorage(allExpenses);
  }, [allExpenses]);

  /**
   * Get expenses for a specific month key
   */
  const getMonthExpenses = useCallback((monthKey) => {
    return allExpenses[monthKey] || [];
  }, [allExpenses]);

  /**
   * Current month expenses
   */
  const currentMonthExpenses = getMonthExpenses(getCurrentMonthKey());

  /**
   * Add a new expense (optimistic + MongoDB POST)
   */
  const addExpense = useCallback(async (expenseData) => {
    const tempId = generateId();
    const monthKey = getMonthKey(expenseData.date);
    const optimisticExpense = {
      id: tempId,
      ...expenseData,
      price: Number(expenseData.price),
      createdAt: Date.now(),
    };

    // Optimistic UI update
    setAllExpenses(prev => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] || []), optimisticExpense],
    }));

    // Save to MongoDB
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: expenseData.name,
          price: Number(expenseData.price),
          date: expenseData.date,
          note: expenseData.note || '',
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        // Replace tempId with real MongoDB id
        setAllExpenses(prev => {
          const list = prev[monthKey] || [];
          return {
            ...prev,
            [monthKey]: list.map(item => (item.id === tempId ? { ...saved, id: String(saved.id || saved._id) } : item)),
          };
        });
        setDbStatus('connected');
        return saved;
      }
    } catch (err) {
      console.warn('Failed to save to MongoDB, kept in local state:', err);
      setDbStatus('offline');
    }

    return optimisticExpense;
  }, []);

  /**
   * Edit an existing expense (optimistic + MongoDB PUT)
   */
  const editExpense = useCallback(async (id, originalMonthKey, updatedData) => {
    const newMonthKey = getMonthKey(updatedData.date);

    // Optimistic update
    setAllExpenses(prev => {
      const next = { ...prev };
      const originalList = (next[originalMonthKey] || []).filter(e => e.id !== id);
      if (originalList.length > 0) {
        next[originalMonthKey] = originalList;
      } else {
        delete next[originalMonthKey];
      }

      const updatedExpense = {
        id,
        ...updatedData,
        price: Number(updatedData.price),
        updatedAt: Date.now(),
      };

      next[newMonthKey] = [...(next[newMonthKey] || []), updatedExpense].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      return next;
    });

    // Update in MongoDB
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedData.name,
          price: Number(updatedData.price),
          date: updatedData.date,
          note: updatedData.note || '',
        }),
      });
      if (res.ok) {
        setDbStatus('connected');
      }
    } catch (err) {
      console.warn('Failed to update in MongoDB:', err);
      setDbStatus('offline');
    }
  }, []);

  /**
   * Delete an expense (optimistic + MongoDB DELETE)
   */
  const deleteExpense = useCallback(async (id, monthKey) => {
    // Optimistic delete
    setAllExpenses(prev => {
      const next = { ...prev };
      const filtered = (next[monthKey] || []).filter(e => e.id !== id);
      if (filtered.length > 0) {
        next[monthKey] = filtered;
      } else {
        delete next[monthKey];
      }
      return next;
    });

    // Delete in MongoDB
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDbStatus('connected');
      }
    } catch (err) {
      console.warn('Failed to delete in MongoDB:', err);
      setDbStatus('offline');
    }
  }, []);

  const allMonthKeys = Object.keys(allExpenses).sort((a, b) => b.localeCompare(a));

  return {
    allExpenses,
    currentMonthExpenses,
    getMonthExpenses,
    addExpense,
    editExpense,
    deleteExpense,
    allMonthKeys,
    dbStatus,
  };
}
