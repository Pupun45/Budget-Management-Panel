// src/components/MonthDetails.jsx
import { useMemo } from 'react';
import { formatINR, formatMonthLabel, formatDateDisplay, computeStats } from '../utils/helpers';
import CategoryBadge from './CategoryBadge';

export default function MonthDetails({ monthKey, expenses, onBack }) {
  const stats = useMemo(() => computeStats(expenses), [expenses]);
  const label = formatMonthLabel(monthKey);

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div id={`month-detail-${monthKey}`}>
      {/* Header */}
      <div className="month-detail-header">
        <div className="month-detail-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8, verticalAlign: 'middle' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {label}
        </div>
        <button id="btn-back-to-history" className="btn btn-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to History
        </button>
      </div>

      {/* Summary stats */}
      <div className="month-detail-summary">
        <div className="detail-stat-card">
          <div className="detail-stat-label">Total Expense</div>
          <div className="detail-stat-value" style={{ color: 'var(--primary)' }}>{formatINR(stats.total)}</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-label">Total Products</div>
          <div className="detail-stat-value">{stats.count}</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-label">Average Expense</div>
          <div className="detail-stat-value" style={{ color: 'var(--success)' }}>{formatINR(stats.average)}</div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-label">Highest Expense</div>
          <div className="detail-stat-value" style={{ color: 'var(--warning)' }}>{formatINR(stats.highest)}</div>
        </div>
      </div>

      {/* Table */}
      <section className="expense-table-wrapper" aria-label={`Expenses for ${label}`}>
        <div className="expense-table-header">
          <span className="expense-table-title">All Expenses</span>
          <span className="expense-count-badge">{expenses.length} {expenses.length === 1 ? 'item' : 'items'}</span>
        </div>

        {/* Desktop */}
        <div className="detail-desktop-only">
          <table className="expense-table" role="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Category</th>
                <th className="right">Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((exp, idx) => (
                <tr key={exp.id}>
                  <td className="text-muted">{idx + 1}</td>
                  <td><div className="product-name">{exp.name}</div></td>
                  <td><CategoryBadge category={exp.category} /></td>
                  <td className="right price-cell">{formatINR(exp.price)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateDisplay(exp.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="detail-mobile-only" style={{ padding: '12px' }}>
          <div className="expense-cards-list">
            {sorted.map(exp => (
              <article key={exp.id} className="expense-card" aria-label={`Expense: ${exp.name}`}>
                <div className="expense-card-top">
                  <div className="expense-card-name">{exp.name}</div>
                  <div className="expense-card-price">{formatINR(exp.price)}</div>
                </div>
                <div className="expense-card-meta">
                  <CategoryBadge category={exp.category} />
                  <span className="expense-card-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {formatDateDisplay(exp.date)}
                  </span>
                </div>
                {exp.note && (
                  <div className="expense-card-note">📝 {exp.note}</div>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Monthly Total Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>Monthly Total</span>
          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '18px' }}>{formatINR(stats.total)}</span>
        </div>
      </section>

      <style>{`
        .detail-desktop-only { display: block; }
        .detail-mobile-only  { display: none;  }
        @media (max-width: 768px) {
          .detail-desktop-only { display: none;  }
          .detail-mobile-only  { display: block; }
        }
      `}</style>
    </div>
  );
}
