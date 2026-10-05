// src/components/ExpenseTable.jsx
import { useState } from 'react';
import { formatINR, formatDateDisplay, getCurrentMonthKey } from '../utils/helpers';
import CategoryBadge from './CategoryBadge';
import ExpenseCard from './ExpenseCard';

function EmptyState() {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <p>
        <strong>No expenses yet</strong>
        Click <strong>Add New Expense</strong> above to get started.
      </p>
    </div>
  );
}

function DeleteConfirmModal({ expense, onConfirm, onCancel }) {
  if (!expense) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="modal">
        <div className="modal-title" id="delete-modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Delete Expense
        </div>
        <p className="confirm-modal-text">
          Are you sure you want to delete <strong>&quot;{expense.name}&quot;</strong>?
          <br />This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button id="btn-cancel-delete" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button id="btn-confirm-delete" className="btn btn-danger" onClick={onConfirm}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseTable({ expenses, onEdit, onDelete, monthKey, isFormOpen, onToggleForm }) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const currentMonth = monthKey || getCurrentMonthKey();

  // Sort expenses: most recent date first
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  function handleDeleteClick(expense) {
    setPendingDelete(expense);
  }

  function handleConfirmDelete() {
    if (pendingDelete) {
      onDelete(pendingDelete.id, currentMonth);
      setPendingDelete(null);
    }
  }

  function handleCancelDelete() {
    setPendingDelete(null);
  }

  function handleEdit(expense) {
    onEdit({ ...expense, _monthKey: currentMonth });
  }

  return (
    <>
      <section className="expense-table-wrapper" aria-label="Expense list">
        <div className="expense-table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="expense-table-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }} aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Expense List
            </span>
            {expenses.length > 0 && (
              <span className="expense-count-badge">{expenses.length} {expenses.length === 1 ? 'item' : 'items'}</span>
            )}
          </div>

          {onToggleForm && (
            <button
              id="btn-toggle-add-form"
              className={`btn btn-sm ${isFormOpen ? 'btn-secondary' : 'btn-primary'}`}
              onClick={onToggleForm}
              aria-expanded={isFormOpen}
              aria-controls="add-expense-form-panel"
            >
              {isFormOpen ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Close Form
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add New Expense
                </>
              )}
            </button>
          )}
        </div>

        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="desktop-only">
              <table className="expense-table" role="table" aria-label="Expenses table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="right">Price</th>
                    <th>Date</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((expense, idx) => (
                    <tr key={expense.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <div className="product-name">{expense.name}</div>
                      </td>
                      <td>
                        <CategoryBadge category={expense.category} />
                      </td>
                      <td className="right price-cell">
                        {formatINR(expense.price)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDateDisplay(expense.date)}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            id={`edit-${expense.id}`}
                            className="btn btn-edit btn-sm"
                            onClick={() => handleEdit(expense)}
                            aria-label={`Edit ${expense.name}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button
                            id={`delete-${expense.id}`}
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteClick(expense)}
                            aria-label={`Delete ${expense.name}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6"/>
                              <path d="M14 11v6"/>
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only" style={{ padding: '12px' }}>
              <div className="expense-cards-list">
                {sorted.map(expense => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <DeleteConfirmModal
        expense={pendingDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <style>{`
        .desktop-only { display: block; }
        .mobile-only  { display: none;  }
        @media (max-width: 768px) {
          .desktop-only { display: none;  }
          .mobile-only  { display: block; }
        }
      `}</style>
    </>
  );
}
