// src/components/ExpenseForm.jsx
import { useState, useEffect, useRef } from 'react';
import { getTodayString } from '../utils/helpers';

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  date: '',
};

export default function ExpenseForm({ onAdd, editingExpense, onEditSave, onEditCancel, isOpen, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, date: getTodayString() });
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);
  const isEditing = Boolean(editingExpense);

  // Populate form when editing
  useEffect(() => {
    if (editingExpense) {
      setForm({
        name: editingExpense.name || '',
        category: editingExpense.category || '',
        price: editingExpense.price !== undefined ? String(editingExpense.price) : '',
        date: editingExpense.date || getTodayString(),
      });
      setErrors({});
    } else {
      setForm({ ...EMPTY_FORM, date: getTodayString() });
      setErrors({});
    }
  }, [editingExpense]);

  // Focus first input when modal opens
  useEffect(() => {
    if ((isOpen || isEditing) && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [isOpen, isEditing]);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') handleCancel();
    }
    if (isOpen || isEditing) {
      document.addEventListener('keydown', onKeyDown);
    }
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isEditing]); // eslint-disable-line

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required.';
    if (!form.category.trim()) errs.category = 'Category is required.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errs.price = 'Enter a valid positive price.';
    if (!form.date) errs.date = 'Please select a date.';
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const expenseData = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      date: form.date,
      note: '',
    };

    if (isEditing) {
      onEditSave(editingExpense.id, editingExpense._monthKey, expenseData);
    } else {
      onAdd(expenseData);
      setForm({ ...EMPTY_FORM, date: getTodayString() });
      onClose?.();
    }
    setErrors({});
  }

  function handleCancel() {
    setForm({ ...EMPTY_FORM, date: getTodayString() });
    setErrors({});
    onEditCancel?.();
    onClose?.();
  }

  // Click outside overlay to close
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) handleCancel();
  }

  if (!isOpen && !isEditing) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-form-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="modal expense-modal">

        {/* Modal Header */}
        <div className="expense-modal-header">
          <div className="modal-title" id="expense-form-modal-title">
            <span className="modal-title-icon">
              {isEditing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              )}
            </span>
            {isEditing ? 'Edit Expense' : 'Add New Expense'}
          </div>

          <button
            id="btn-close-expense-modal"
            className="modal-close-btn"
            onClick={handleCancel}
            aria-label="Close form"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="expense-modal-divider" />

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate id="expense-form">
          <div className="expense-modal-body">

            {/* Row 1: Name + Category */}
            <div className="modal-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="expense-name">
                  Product / Expense Name <span className="required">*</span>
                </label>
                <input
                  id="expense-name"
                  ref={firstInputRef}
                  type="text"
                  name="name"
                  className={`form-control${errors.name ? ' error' : ''}`}
                  placeholder="e.g. Groceries, Petrol…"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="off"
                  maxLength={100}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-category">
                  Category <span className="required">*</span>
                </label>
                <input
                  id="expense-category"
                  type="text"
                  name="category"
                  className={`form-control${errors.category ? ' error' : ''}`}
                  placeholder="e.g. Food, Transport, Bills…"
                  value={form.category}
                  onChange={handleChange}
                  autoComplete="off"
                  maxLength={50}
                />
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>
            </div>

            {/* Row 2: Price + Date */}
            <div className="modal-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="expense-price">
                  Price (₹) <span className="required">*</span>
                </label>
                <input
                  id="expense-price"
                  type="number"
                  name="price"
                  className={`form-control${errors.price ? ' error' : ''}`}
                  placeholder="e.g. 500"
                  value={form.price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                />
                {errors.price && <span className="field-error">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-date">
                  Date <span className="required">*</span>
                </label>
                <input
                  id="expense-date"
                  type="date"
                  name="date"
                  className={`form-control${errors.date ? ' error' : ''}`}
                  value={form.date}
                  onChange={handleChange}
                />
                {errors.date && <span className="field-error">{errors.date}</span>}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="expense-modal-divider" />
          <div className="expense-modal-footer">
            <button
              type="button"
              id="btn-cancel-form"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              id={isEditing ? 'btn-save-expense' : 'btn-add-expense'}
              className="btn btn-primary"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {isEditing
                  ? <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>
                  : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                }
              </svg>
              {isEditing ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>

      </div>

      <style>{`
        .expense-modal {
          max-width: 560px;
          padding: 0;
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .expense-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
        }
        .expense-modal-header .modal-title {
          margin-bottom: 0;
          font-size: 17px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-title-icon {
          width: 34px;
          height: 34px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .modal-close-btn {
          width: 32px;
          height: 32px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface-2);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition);
          flex-shrink: 0;
        }
        .modal-close-btn:hover {
          background: var(--danger-light);
          color: var(--danger);
          border-color: #fca5a5;
        }
        .expense-modal-divider {
          height: 1px;
          background: var(--border);
        }
        .expense-modal-body {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .expense-modal-footer {
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          background: var(--surface-2);
        }
        .field-error {
          color: var(--danger);
          font-size: 12px;
          margin-top: 3px;
          display: block;
        }
        .form-control.error {
          border-color: var(--danger);
        }
        .form-control.error:focus {
          box-shadow: 0 0 0 3px rgba(220,38,38,0.12);
        }
        @media (max-width: 500px) {
          .expense-modal {
            max-width: 100%;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            margin: 0 !important;
          }
          .modal-overlay {
            align-items: flex-end;
          }
          .modal-form-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
