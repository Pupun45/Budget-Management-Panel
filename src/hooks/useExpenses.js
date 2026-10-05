// src/hooks/useExpenses.js
import { useState, useEffect, useCallback } from 'react';
import { getMonthKey, generateId, getCurrentMonthKey } from '../utils/helpers';

const STORAGE_KEY = 'budget_panel_expenses_v1';

/**
 * Load all expenses from localStorage.
 * Returns an object keyed by monthKey: { "2026-10": [expense, ...], ... }
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

export function useExpenses() {
  const [allExpenses, setAllExpenses] = useState(loadFromStorage);

  // Persist to localStorage whenever allExpenses changes
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
   * Get the current month's expenses
   */
  const currentMonthExpenses = getMonthExpenses(getCurrentMonthKey());

  /**
   * Add a new expense
   */
  const addExpense = useCallback((expenseData) => {
    const monthKey = getMonthKey(expenseData.date);
    const newExpense = {
      id: generateId(),
      ...expenseData,
      price: Number(expenseData.price),
      createdAt: Date.now(),
    };
    setAllExpenses(prev => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] || []), newExpense],
    }));
    return newExpense;
  }, []);

  /**
   * Edit an existing expense. If the date changes and results in a different
   * month, move the expense to the correct month.
   */
  const editExpense = useCallback((id, originalMonthKey, updatedData) => {
    const newMonthKey = getMonthKey(updatedData.date);

    setAllExpenses(prev => {
      const next = { ...prev };

      // Remove from original month
      const originalList = (next[originalMonthKey] || []).filter(e => e.id !== id);
      if (originalList.length > 0) {
        next[originalMonthKey] = originalList;
      } else {
        delete next[originalMonthKey];
      }

      // Add to (potentially new) month
      const updatedExpense = {
        id,
        ...updatedData,
        price: Number(updatedData.price),
        updatedAt: Date.now(),
      };
      next[newMonthKey] = [...(next[newMonthKey] || []), updatedExpense]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return next;
    });
  }, []);

  /**
   * Delete an expense by id and monthKey
   */
  const deleteExpense = useCallback((id, monthKey) => {
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
  }, []);

  /**
   * Get sorted list of all month keys (most recent first)
   */
  const allMonthKeys = Object.keys(allExpenses).sort((a, b) => b.localeCompare(a));

  return {
    allExpenses,
    currentMonthExpenses,
    getMonthExpenses,
    addExpense,
    editExpense,
    deleteExpense,
    allMonthKeys,
  };
}
