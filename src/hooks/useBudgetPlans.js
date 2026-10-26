// src/hooks/useBudgetPlans.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCurrentMonthKey, generateId } from '../utils/helpers';

const STORAGE_KEY = 'budget_panel_target_plans_v1';
const API_URL = '/api/budgets';

/**
 * Load budget plans from localStorage
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load budget plans from localStorage:', e);
  }
  return [];
}

/**
 * Save budget plans to localStorage
 */
function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save budget plans to localStorage:', e);
  }
}

export function useBudgetPlans() {
  const [plans, setPlans] = useState(loadFromStorage);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('connected'); // 'connected' | 'offline'

  // Fetch all budget plans from backend MongoDB on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchPlans() {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();

        if (isMounted) {
          if (Array.isArray(data)) {
            const localStored = loadFromStorage();
            // If remote DB is empty but we have local plans, migrate them
            if (data.length === 0 && localStored.length > 0) {
              for (const plan of localStored) {
                try {
                  await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(plan),
                  });
                } catch (migrErr) {
                  console.error('Failed migrating plan:', migrErr);
                }
              }
              const refetchRes = await fetch(API_URL);
              const refetched = await refetchRes.json();
              if (Array.isArray(refetched)) {
                setPlans(refetched);
                saveToStorage(refetched);
              }
            } else {
              setPlans(data);
              saveToStorage(data);
            }
          }
          setSyncStatus('connected');
        }
      } catch (err) {
        console.warn('Backend unreachable for budgets, using local data:', err.message);
        if (isMounted) setSyncStatus('offline');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage whenever plans change
  useEffect(() => {
    saveToStorage(plans);
  }, [plans]);

  // Filter plans for the currently selected month
  const currentMonthPlans = useMemo(() => {
    return plans.filter(p => p.monthKey === selectedMonth);
  }, [plans, selectedMonth]);

  // Compute top level totals for the selected month
  const totals = useMemo(() => {
    let totalTarget = 0;
    let totalUsed = 0;

    currentMonthPlans.forEach(plan => {
      totalTarget += Number(plan.targetBudget || 0);
      const planExpenses = Array.isArray(plan.expenses) ? plan.expenses : [];
      const planSpent = planExpenses.reduce((sum, item) => sum + Number(item.price || 0), 0);
      totalUsed += planSpent;
    });

    const remaining = totalTarget - totalUsed;
    const percentage = totalTarget > 0 ? Math.round((totalUsed / totalTarget) * 100) : 0;

    let status = 'safe'; // 'safe' | 'warning' | 'danger'
    if (percentage >= 100) status = 'danger';
    else if (percentage >= 80) status = 'warning';

    return {
      totalTarget,
      totalUsed,
      remaining,
      percentage,
      status,
      planCount: currentMonthPlans.length,
    };
  }, [currentMonthPlans]);

  /**
   * Add a new budget plan
   */
  const addPlan = useCallback(async (planData) => {
    const tempId = `temp-${generateId()}`;
    const newPlan = {
      id: tempId,
      name: planData.name.trim(),
      targetBudget: Number(planData.targetBudget),
      monthKey: planData.monthKey || selectedMonth,
      category: planData.category || 'General',
      color: planData.color || '#4f46e5',
      expenses: [],
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setPlans(prev => [newPlan, ...prev]);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      });

      if (res.ok) {
        const saved = await res.json();
        setPlans(prev => prev.map(p => (p.id === tempId ? { ...saved, id: String(saved.id || saved._id) } : p)));
        setSyncStatus('connected');
        return saved;
      }
    } catch (err) {
      console.warn('Failed to save budget plan to backend:', err);
      setSyncStatus('offline');
    }

    return newPlan;
  }, [selectedMonth]);

  /**
   * Update an existing budget plan
   */
  const updatePlan = useCallback(async (id, updatedFields) => {
    // Optimistic update
    setPlans(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updatedFields,
          targetBudget: updatedFields.targetBudget !== undefined ? Number(updatedFields.targetBudget) : p.targetBudget,
        };
      }
      return p;
    }));

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });

      if (res.ok) {
        const saved = await res.json();
        setPlans(prev => prev.map(p => (p.id === id ? { ...saved, id: String(saved.id || saved._id) } : p)));
        setSyncStatus('connected');
      }
    } catch (err) {
      console.warn('Failed to update plan in backend:', err);
      setSyncStatus('offline');
    }
  }, []);

  /**
   * Delete a budget plan
   */
  const deletePlan = useCallback(async (id) => {
    setPlans(prev => prev.filter(p => p.id !== id));

    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Failed to delete plan from backend:', err);
      setSyncStatus('offline');
    }
  }, []);

  /**
   * Add an expense item directly to a budget plan
   */
  const addExpenseToPlan = useCallback(async (planId, expenseData) => {
    const expenseId = `exp-${generateId()}`;
    const newExpense = {
      id: expenseId,
      name: expenseData.name.trim(),
      price: Number(expenseData.price),
      date: expenseData.date,
      note: expenseData.note ? expenseData.note.trim() : '',
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const currentExpenses = Array.isArray(plan.expenses) ? plan.expenses : [];
        return {
          ...plan,
          expenses: [newExpense, ...currentExpenses],
        };
      }
      return plan;
    }));

    try {
      const res = await fetch(`${API_URL}/${planId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expenseId,
          name: expenseData.name,
          price: Number(expenseData.price),
          date: expenseData.date,
          note: expenseData.note || '',
        }),
      });

      if (res.ok) {
        const updatedPlan = await res.json();
        setPlans(prev => prev.map(p => (p.id === planId ? { ...updatedPlan, id: String(updatedPlan.id || updatedPlan._id) } : p)));
        setSyncStatus('connected');
      }
    } catch (err) {
      console.warn('Failed to save plan expense to backend:', err);
      setSyncStatus('offline');
    }
  }, []);

  /**
   * Delete an expense item from a budget plan
   */
  const deleteExpenseFromPlan = useCallback(async (planId, expenseId) => {
    // Optimistic update
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const currentExpenses = Array.isArray(plan.expenses) ? plan.expenses : [];
        return {
          ...plan,
          expenses: currentExpenses.filter(e => e.id !== expenseId),
        };
      }
      return plan;
    }));

    try {
      const res = await fetch(`${API_URL}/${planId}/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedPlan = await res.json();
        setPlans(prev => prev.map(p => (p.id === planId ? { ...updatedPlan, id: String(updatedPlan.id || updatedPlan._id) } : p)));
        setSyncStatus('connected');
      }
    } catch (err) {
      console.warn('Failed to delete plan expense from backend:', err);
      setSyncStatus('offline');
    }
  }, []);

  return {
    plans: currentMonthPlans,
    allPlans: plans,
    totals,
    selectedMonth,
    setSelectedMonth,
    loading,
    syncStatus,
    addPlan,
    updatePlan,
    deletePlan,
    addExpenseToPlan,
    deleteExpenseFromPlan,
  };
}
