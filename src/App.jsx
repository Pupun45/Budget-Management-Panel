// src/App.jsx
import { useState, useCallback } from 'react';
import './App.css';

import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import SummaryCards from './components/SummaryCards';
import ExpenseForm from './components/ExpenseForm';
import ExpenseTable from './components/ExpenseTable';
import MonthlyHistory from './components/MonthlyHistory';
import Toast from './components/Toast';

import { useExpenses } from './hooks/useExpenses';
import { getCurrentMonthKey } from './utils/helpers';

let toastIdCounter = 0;

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, addToast };
}

export default function App() {
  const [activeTab, setActiveTab]     = useState('current');
  const [editingExpense, setEditingExpense] = useState(null);
  const [isFormOpen, setIsFormOpen]   = useState(false);

  const {
    allExpenses,
    currentMonthExpenses,
    addExpense,
    editExpense,
    deleteExpense,
    allMonthKeys,
    dbStatus,
  } = useExpenses();

  const { toasts, addToast } = useToast();
  const currentMonthKey = getCurrentMonthKey();

  // ---------- Handlers ----------

  function handleAdd(expenseData) {
    addExpense(expenseData);
    addToast('Expense added successfully!', 'success');
  }

  function handleEditStart(expense) {
    setEditingExpense(expense);
    setIsFormOpen(true);
    setTimeout(() => {
      document.getElementById('add-expense-form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleEditSave(id, originalMonthKey, updatedData) {
    editExpense(id, originalMonthKey, updatedData);
    setEditingExpense(null);
    setIsFormOpen(false);
    addToast('Expense updated successfully!', 'success');
  }

  function handleEditCancel() {
    setEditingExpense(null);
    setIsFormOpen(false);
  }

  function handleDelete(id, monthKey) {
    deleteExpense(id, monthKey);
    addToast('Expense deleted.', 'danger');
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setEditingExpense(null);
    setIsFormOpen(false);
  }

  function handleToggleForm() {
    if (editingExpense) {
      // If editing, cancel and close
      setEditingExpense(null);
    }
    setIsFormOpen(prev => !prev);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  return (
    <div className="app-wrapper">
      <Header dbStatus={dbStatus} />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="main-content" role="main">

        {/* ---- Current Month Tab ---- */}
        {activeTab === 'current' && (
          <div id="panel-current" role="tabpanel" aria-labelledby="tab-current">
            <SummaryCards expenses={currentMonthExpenses} />

            {/* Expense List with Add button in its header */}
            <ExpenseTable
              expenses={currentMonthExpenses}
              onEdit={handleEditStart}
              onDelete={handleDelete}
              monthKey={currentMonthKey}
              isFormOpen={isFormOpen || Boolean(editingExpense)}
              onToggleForm={handleToggleForm}
            />

            {/* Popup modal form */}
            <ExpenseForm
              isOpen={isFormOpen}
              onClose={handleCloseForm}
              onAdd={handleAdd}
              editingExpense={editingExpense}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
            />
          </div>
        )}

        {/* ---- Monthly History Tab ---- */}
        {activeTab === 'history' && (
          <div id="panel-history-tab" role="tabpanel" aria-labelledby="tab-history">
            <MonthlyHistory
              allExpenses={allExpenses}
              allMonthKeys={allMonthKeys}
            />
          </div>
        )}
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}
