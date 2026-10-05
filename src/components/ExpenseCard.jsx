// src/components/ExpenseCard.jsx  (Mobile card view)
import { formatINR, formatDateDisplay } from '../utils/helpers';
import CategoryBadge from './CategoryBadge';

export default function ExpenseCard({ expense, onEdit, onDelete }) {
  return (
    <article className="expense-card" aria-label={`Expense: ${expense.name}`}>
      <div className="expense-card-top">
        <div>
          <div className="expense-card-name">{expense.name}</div>
        </div>
        <div className="expense-card-price">{formatINR(expense.price)}</div>
      </div>

      <div className="expense-card-bottom">
        <div className="expense-card-meta">
          <CategoryBadge category={expense.category} />
          <span className="expense-card-date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formatDateDisplay(expense.date)}
          </span>
        </div>

        <div className="expense-card-actions">
          <button
            id={`mobile-edit-${expense.id}`}
            className="btn btn-edit btn-icon"
            onClick={() => onEdit(expense)}
            aria-label={`Edit ${expense.name}`}
            title="Edit"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            id={`mobile-delete-${expense.id}`}
            className="btn btn-danger btn-icon"
            onClick={() => onDelete(expense)}
            aria-label={`Delete ${expense.name}`}
            title="Delete"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
