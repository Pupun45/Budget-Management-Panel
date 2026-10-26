// src/components/TargetBudgetPanel.jsx
import { useState, useEffect, useMemo } from 'react';
import { formatINR, formatDateDisplay, formatMonthLabel, getCurrentMonthKey, getTodayString } from '../utils/helpers';
import { useBudgetPlans } from '../hooks/useBudgetPlans';

const PLAN_CATEGORIES = [
  { id: 'groceries', label: 'Groceries & Food', icon: '🛒', color: '#10b981' },
  { id: 'housing', label: 'Rent & Housing', icon: '🏠', color: '#6366f1' },
  { id: 'dining', label: 'Dining & Takeout', icon: '🍕', color: '#f59e0b' },
  { id: 'shopping', label: 'Shopping & Clothes', icon: '🛍️', color: '#ec4899' },
  { id: 'transport', label: 'Travel & Fuel', icon: '🚗', color: '#06b6d4' },
  { id: 'bills', label: 'Bills & Utilities', icon: '⚡', color: '#8b5cf6' },
  { id: 'entertainment', label: 'Entertainment & Fun', icon: '🍿', color: '#ef4444' },
  { id: 'health', label: 'Health & Medical', icon: '💊', color: '#14b8a6' },
  { id: 'general', label: 'General / Other', icon: '🎯', color: '#4f46e5' },
];

function getCategoryMeta(categoryName) {
  const match = PLAN_CATEGORIES.find(c => c.label.toLowerCase() === (categoryName || '').toLowerCase() || c.id === categoryName);
  return match || { id: 'custom', label: categoryName || 'Budget Plan', icon: '🎯', color: '#4f46e5' };
}

// -------------------------------------------------------------
// Modal: Add or Edit Budget Plan
// -------------------------------------------------------------
function PlanFormModal({ isOpen, onClose, onSave, editingPlan, selectedMonth }) {
  const [name, setName] = useState(editingPlan ? editingPlan.name : '');
  const [targetBudget, setTargetBudget] = useState(editingPlan ? editingPlan.targetBudget : '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingPlan) {
        setName(editingPlan.name || '');
        setTargetBudget(editingPlan.targetBudget || '');
      } else {
        setName('');
        setTargetBudget('');
      }
      setError('');
    }
  }, [editingPlan, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a plan name.');
      return;
    }
    const amount = Number(targetBudget);
    if (isNaN(amount) || amount <= 0) {
      setError('Target budget must be greater than 0.');
      return;
    }

    // Auto-detect matching category from name or default to General
    const lower = name.toLowerCase();
    const matchedCategory = PLAN_CATEGORIES.find(c => lower.includes(c.id) || lower.includes(c.label.toLowerCase().split(' ')[0]));
    const category = editingPlan ? editingPlan.category : (matchedCategory ? matchedCategory.label : 'General');
    const color = editingPlan ? editingPlan.color : (matchedCategory ? matchedCategory.color : '#4f46e5');

    onSave({
      name: name.trim(),
      targetBudget: amount,
      category,
      color,
      monthKey: editingPlan ? editingPlan.monthKey : selectedMonth,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
      <div className="modal budget-plan-modal">
        <div className="modal-title" id="plan-modal-title">
          <span className="modal-title-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </span>
          {editingPlan ? 'Edit Budget Plan' : 'Create New Target Budget Plan'}
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="budget-plan-form">

          <div className="form-group" style={{ width: '100%' }}>
            <label htmlFor="plan-name-input" className="form-label">
              Plan Name <span className="required">*</span>
            </label>
            <input
              id="plan-name-input"
              type="text"
              className="form-input form-control"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. Groceries & Essentials"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              autoFocus
              maxLength={60}
            />
          </div>

          <div className="form-group" style={{ width: '100%' }}>
            <label htmlFor="plan-target-input" className="form-label">
              Target Budget (₹) <span className="required">*</span>
            </label>
            <div className="input-prefix-wrapper" style={{ width: '100%', boxSizing: 'border-box' }}>
              <span className="input-prefix">₹</span>
              <input
                id="plan-target-input"
                type="number"
                min="1"
                step="any"
                className="form-input form-control with-prefix"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="e.g. 10000"
                value={targetBudget}
                onChange={e => { setTargetBudget(e.target.value); setError(''); }}
              />
            </div>
            <span className="input-hint">Maximum amount you aim to spend for this plan.</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-save-budget-plan">
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Modal: Add Expense Item to a Budget Plan (with Plan Dropdown)
// -------------------------------------------------------------
function AddPlanExpenseModal({ isOpen, onClose, onAdd, plans = [], targetPlan, onOpenCreatePlan }) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (targetPlan) {
        setSelectedPlanId(targetPlan.id);
      } else if (plans && plans.length > 0) {
        setSelectedPlanId(plans[0].id);
      } else {
        setSelectedPlanId('');
      }
      setName('');
      setPrice('');
      setDate(getTodayString());
      setNote('');
      setError('');
    }
  }, [isOpen, targetPlan, plans]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPlanId) {
      setError('Please select a budget plan.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter expense name.');
      return;
    }
    const amount = Number(price);
    if (isNaN(amount) || amount <= 0) {
      setError('Price must be greater than 0.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }

    onAdd(selectedPlanId, {
      name: name.trim(),
      price: amount,
      date,
      note: note.trim(),
    });
    onClose();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-expense-modal-title">
      <div className="modal budget-plan-modal">
        <div className="modal-title" id="add-expense-modal-title">
          <span className="modal-title-icon" style={{ background: '#e0f2fe', color: '#0891b2' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          Add Expense
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div className="plan-no-expenses" style={{ margin: '10px 0 16px', fontSize: '13px' }}>
              No budget plans found for this month. Please create a budget plan first before logging expenses.
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (onOpenCreatePlan) onOpenCreatePlan();
              }}
            >
              + Create Budget Plan
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="budget-plan-form">
            {/* Plan selection dropdown */}
            <div className="form-group" style={{ width: '100%' }}>
              <label htmlFor="select-plan-dropdown" className="form-label">
                Select Budget Plan <span className="required">*</span>
              </label>
              <select
                id="select-plan-dropdown"
                className="form-input form-control"
                value={selectedPlanId}
                onChange={e => { setSelectedPlanId(e.target.value); setError(''); }}
                style={{ width: '100%', boxSizing: 'border-box', cursor: 'pointer', height: '42px' }}
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Budget: {formatINR(p.targetBudget || p.target)} | Spent: {formatINR(p.spent || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ width: '100%' }}>
              <label htmlFor="expense-name-input" className="form-label">
                Expense / Product Name <span className="required">*</span>
              </label>
              <input
                id="expense-name-input"
                type="text"
                className="form-input form-control"
                placeholder="e.g. Supermarket shopping, Veggies"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                autoFocus
                maxLength={80}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ width: '100%' }}>
                <label htmlFor="expense-price-input" className="form-label">
                  Expense Price (₹) <span className="required">*</span>
                </label>
                <div className="input-prefix-wrapper" style={{ width: '100%', boxSizing: 'border-box' }}>
                  <span className="input-prefix">₹</span>
                  <input
                    id="expense-price-input"
                    type="number"
                    min="0.01"
                    step="any"
                    className="form-input form-control with-prefix"
                    placeholder="e.g. 450"
                    value={price}
                    onChange={e => { setPrice(e.target.value); setError(''); }}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ width: '100%' }}>
                <label htmlFor="expense-date-input" className="form-label">
                  Date <span className="required">*</span>
                </label>
                <input
                  id="expense-date-input"
                  type="date"
                  className="form-input form-control"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ width: '100%' }}>
              <label htmlFor="expense-note-input" className="form-label">
                Note (Optional)
              </label>
              <input
                id="expense-note-input"
                type="text"
                className="form-input form-control"
                placeholder="e.g. Bill paid via UPI"
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={100}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                id="btn-submit-plan-expense"
                style={{ background: '#059669', borderColor: '#059669' }}
              >
                Add Expense
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Delete Confirm Modal
// -------------------------------------------------------------
function DeleteConfirmModal({ title, message, onConfirm, onCancel }) {
  if (!message) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          {title || 'Confirm Delete'}
        </div>
        <p className="confirm-modal-text">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} id="btn-confirm-modal-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main TargetBudgetPanel Component
// -------------------------------------------------------------
export default function TargetBudgetPanel({ addToast, budgetHook }) {
  const fallbackHook = useBudgetPlans();
  const {
    plans,
    totals,
    selectedMonth,
    setSelectedMonth,
    addPlan,
    updatePlan,
    deletePlan,
    deleteExpenseFromPlan,
  } = budgetHook || fallbackHook;

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'plan' | 'expense', planId, expenseId, name }
  const [expandedPlanIds, setExpandedPlanIds] = useState({});

  const currentMonthKey = getCurrentMonthKey();
  const monthDisplay = formatMonthLabel(selectedMonth);

  // Month navigation
  function handlePrevMonth() {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevKey);
  }

  function handleNextMonth() {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextKey);
  }

  function handleResetToCurrentMonth() {
    setSelectedMonth(currentMonthKey);
  }

  // Plan actions
  function handleOpenCreatePlan() {
    setEditingPlan(null);
    setIsPlanModalOpen(true);
  }

  function handleOpenEditPlan(plan) {
    setEditingPlan(plan);
    setIsPlanModalOpen(true);
  }

  function handleSavePlan(formData) {
    if (editingPlan) {
      updatePlan(editingPlan.id, formData);
      if (addToast) addToast(`Plan "${formData.name}" updated successfully!`, 'success');
    } else {
      addPlan(formData);
      if (addToast) addToast(`Target Budget plan "${formData.name}" created!`, 'success');
    }
  }

  function handleDeletePlanClick(plan) {
    setDeleteTarget({
      type: 'plan',
      planId: plan.id,
      name: plan.name,
      message: `Are you sure you want to delete "${plan.name}" and all its recorded expenses? This cannot be undone.`,
    });
  }

  function handleDeleteExpenseClick(planId, expense) {
    setDeleteTarget({
      type: 'expense',
      planId,
      expenseId: expense.id,
      name: expense.name,
      message: `Remove "${expense.name}" (${formatINR(expense.price)}) from this plan?`,
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'plan') {
      deletePlan(deleteTarget.planId);
      if (addToast) addToast(`Budget plan deleted.`, 'danger');
    } else if (deleteTarget.type === 'expense') {
      deleteExpenseFromPlan(deleteTarget.planId, deleteTarget.expenseId);
      if (addToast) addToast(`Expense item removed.`, 'danger');
    }
    setDeleteTarget(null);
  }



  function toggleExpandPlan(planId) {
    setExpandedPlanIds(prev => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  }

  // Pre-populate popular plans if list is empty
  function handleAddPresetStarterPlans() {
    const starterPlans = [
      { name: 'Groceries & Food', targetBudget: 12000, category: 'Groceries & Food', color: '#10b981' },
      { name: 'Rent & Maintenance', targetBudget: 18000, category: 'Rent & Housing', color: '#6366f1' },
      { name: 'Dining & Food Delivery', targetBudget: 4500, category: 'Dining & Takeout', color: '#f59e0b' },
      { name: 'Fuel & Commute', targetBudget: 3500, category: 'Travel & Fuel', color: '#06b6d4' },
    ];
    starterPlans.forEach(p => addPlan({ ...p, monthKey: selectedMonth }));
    if (addToast) addToast('Standard budget plans added!', 'success');
  }

  // Calculations for plans list with spent & percentage
  const processedPlans = useMemo(() => {
    return plans.map(plan => {
      const expenses = Array.isArray(plan.expenses) ? plan.expenses : [];
      const spent = expenses.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const target = Number(plan.targetBudget || 0);
      const remaining = target - spent;
      const percent = target > 0 ? Math.round((spent / target) * 100) : 0;
      const isOver = spent > target;
      const isNear = !isOver && percent >= 80;

      return {
        ...plan,
        spent,
        target,
        remaining,
        percent,
        isOver,
        isNear,
        expenses,
      };
    });
  }, [plans]);

  return (
    <div className="target-budget-container">
      {/* ======================================================== */}
      {/* 1. Header & Month Navigator */}
      {/* ======================================================== */}
      <div className="target-budget-header">
        <div className="target-budget-header-left">
          <div className="target-badge-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span>Target Budget Planner</span>
          </div>
          <h2 className="target-budget-title">Monthly Spending</h2>
        </div>

        <div className="target-budget-header-actions">
          {/* Month Switcher */}
          <div className="month-navigator-box">
            <button
              className="month-nav-arrow"
              onClick={handlePrevMonth}
              title="Previous Month"
              aria-label="Previous Month"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="month-nav-label">{monthDisplay}</span>
            <button
              className="month-nav-arrow"
              onClick={handleNextMonth}
              title="Next Month"
              aria-label="Next Month"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            {selectedMonth !== currentMonthKey && (
              <button
                className="btn-today-pill"
                onClick={handleResetToCurrentMonth}
                title="Go to current month"
              >
                Current
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Top Summary Metrics ("in top show total budget and use budget") */}
      {/* ======================================================== */}
      <section className="target-summary-cards" aria-label="Target Budget Summary Overview">
        {/* Card 1: Total Budget */}
        <div className="target-stat-card card-total-budget">
          <div className="target-stat-accent accent-indigo" />
          <div className="target-stat-top">
            <div className="target-stat-icon icon-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <span className="target-stat-pill pill-indigo">Target</span>
          </div>
          <div className="target-stat-label">Total Target Budget</div>
          <div className="target-stat-value" id="val-total-target-budget">
            {formatINR(totals.totalTarget)}
          </div>
          <div className="target-stat-sub">
            {totals.planCount === 0 ? 'No plans set for this month' : `Across ${totals.planCount} budget plan${totals.planCount > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Card 2: Used Budget */}
        <div className="target-stat-card card-used-budget">
          <div className="target-stat-accent accent-cyan" />
          <div className="target-stat-top">
            <div className="target-stat-icon icon-cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <span className="target-stat-pill pill-cyan">Spent</span>
          </div>
          <div className="target-stat-label">Used Budget (Spent)</div>
          <div className="target-stat-value" id="val-total-used-budget">
            {formatINR(totals.totalUsed)}
          </div>
          <div className="target-stat-sub">
            {totals.totalTarget > 0 ? `${totals.percentage}% of total budget consumed` : 'Total expenses logged'}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. Multiple Budget Plans Cards Grid */}
      {/* ======================================================== */}
      <section className="budget-plans-grid-section" aria-label="Budget Plans">
        <div className="grid-section-header">
          <div>
            <h3 className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Active Budget Plans ({processedPlans.length})
            </h3>
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={handleOpenCreatePlan}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Plan
          </button>
        </div>

        {/* Empty state if no plans */}
        {processedPlans.length === 0 && (
          <div className="budget-empty-card">
            <div className="budget-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h4>No Budget Plans for {monthDisplay}</h4>
            <div className="empty-action-buttons">
              <button
                className="btn btn-primary"
                onClick={handleOpenCreatePlan}
                id="btn-create-first-plan"
              >
                + Create Custom Plan
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleAddPresetStarterPlans}
                id="btn-add-starter-plans"
              >
                ⚡ Add Standard Starter Plans
              </button>
            </div>
          </div>
        )}

        {/* Grid of Plan Cards */}
        <div className="budget-cards-grid">
          {processedPlans.map(plan => {
            const meta = getCategoryMeta(plan.category);
            const isExpanded = expandedPlanIds[plan.id];
            const visibleExpenses = isExpanded ? plan.expenses : plan.expenses.slice(0, 3);

            return (
              <div key={plan.id} className={`budget-plan-card ${plan.isOver ? 'card-border-danger' : ''}`} id={`plan-card-${plan.id}`}>
                {/* Accent top line */}
                <div className="plan-card-top-accent" style={{ background: plan.color || meta.color }} />

                {/* Plan Card Header */}
                <div className="plan-card-header">
                  <div className="plan-card-title-group">
                    <span className="plan-category-icon" style={{ background: `${plan.color || meta.color}18`, color: plan.color || meta.color }}>
                      {meta.icon}
                    </span>
                    <div>
                      <h4 className="plan-name-text">{plan.name}</h4>
                      <span className="plan-category-subtitle">{plan.category}</span>
                    </div>
                  </div>

                  <div className="plan-card-actions">
                    <button
                      className="btn-icon-subtle"
                      onClick={() => handleOpenEditPlan(plan)}
                      title="Edit target budget or name"
                      aria-label="Edit Plan"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="btn-icon-subtle btn-delete-subtle"
                      onClick={() => handleDeletePlanClick(plan)}
                      title="Delete budget plan"
                      aria-label="Delete Plan"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Numbers Comparison Row */}
                <div className="plan-metrics-box">
                  <div className="plan-metric-col">
                    <span className="metric-title">Target Budget</span>
                    <span className="metric-val target-color">{formatINR(plan.target)}</span>
                  </div>
                  <div className="plan-metric-divider" />
                  <div className="plan-metric-col">
                    <span className="metric-title">Used / Spent</span>
                    <span className="metric-val spent-color">{formatINR(plan.spent)}</span>
                  </div>
                  <div className="plan-metric-divider" />
                  <div className="plan-metric-col">
                    <span className="metric-title">{plan.remaining >= 0 ? 'Remaining' : 'Overspent'}</span>
                    <span className={`metric-val ${plan.remaining >= 0 ? 'remaining-color' : 'danger-color'}`}>
                      {formatINR(Math.abs(plan.remaining))}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="plan-progress-container">
                  <div className="plan-progress-header">
                    <span className={`plan-status-pill ${plan.isOver ? 'danger' : plan.isNear ? 'warning' : 'safe'}`}>
                      {plan.isOver ? '⚠️ Over Budget' : plan.isNear ? '⚡ Near Limit' : '✓ Safe'}
                    </span>
                    <span className="plan-percentage-text">
                      <strong>{plan.percent}%</strong> used
                    </span>
                  </div>
                  <div className="plan-progress-track">
                    <div
                      className={`plan-progress-fill ${plan.isOver ? 'danger' : plan.isNear ? 'warning' : 'safe'}`}
                      style={{ width: `${Math.min(plan.percent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expenses Log Section */}
                <div className="plan-expenses-section">
                  <div className="plan-expenses-header">
                    <span className="expenses-section-title">
                      Expenses ({plan.expenses.length})
                    </span>
                  </div>

                  {plan.expenses.length === 0 ? (
                    <div className="plan-no-expenses">
                      <span>No expenses logged for this plan yet.</span>
                    </div>
                  ) : (
                    <div className="plan-expenses-list">
                      {visibleExpenses.map(item => (
                        <div key={item.id} className="plan-expense-item">
                          <div className="expense-item-left">
                            <span className="expense-item-name">{item.name}</span>
                            <span className="expense-item-date">{formatDateDisplay(item.date)}</span>
                          </div>
                          <div className="expense-item-right">
                            <span className="expense-item-price">{formatINR(item.price)}</span>
                            <button
                              className="btn-trash-item"
                              onClick={() => handleDeleteExpenseClick(plan.id, item)}
                              title="Delete expense item"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}

                      {plan.expenses.length > 3 && (
                        <button
                          className="btn-toggle-expenses"
                          onClick={() => toggleExpandPlan(plan.id)}
                        >
                          {isExpanded
                            ? 'Show Less'
                            : `+ Show ${plan.expenses.length - 3} more expenses`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* Modals */}
      {/* ======================================================== */}
      <PlanFormModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSave={handleSavePlan}
        editingPlan={editingPlan}
        selectedMonth={selectedMonth}
      />

      <DeleteConfirmModal
        title={deleteTarget?.type === 'plan' ? 'Delete Budget Plan' : 'Remove Expense Item'}
        message={deleteTarget?.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
