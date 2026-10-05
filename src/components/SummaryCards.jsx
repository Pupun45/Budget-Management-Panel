// src/components/SummaryCards.jsx
import { useMemo } from 'react';
import { formatINR, computeStats } from '../utils/helpers';

export const CARD_DEFS = {
  total: {
    key: 'total',
    label: 'Total Expense',
    accent: '#4f46e5',
    iconBg: '#eef2ff',
    iconColor: '#4f46e5',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    format: (val) => formatINR(val),
  },
  count: {
    key: 'count',
    label: 'Total Products',
    accent: '#0891b2',
    iconBg: '#e0f2fe',
    iconColor: '#0891b2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    format: (val) => (val ?? 0).toString(),
  },
  average: {
    key: 'average',
    label: 'Average Expense',
    accent: '#16a34a',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    format: (val) => formatINR(val),
  },
  highest: {
    key: 'highest',
    label: 'Highest Expense',
    accent: '#d97706',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    format: (val) => formatINR(val),
  },
};

export default function SummaryCards({ expenses, cardKeys = ['total', 'count'], stats: customStats }) {
  const stats = useMemo(() => {
    if (customStats) return customStats;
    return computeStats(expenses || []);
  }, [customStats, expenses]);

  const cardsToShow = cardKeys.map(key => CARD_DEFS[key]).filter(Boolean);

  return (
    <section aria-label="Expense Summary" className="summary-grid">
      {cardsToShow.map(card => (
        <div key={card.key} className="summary-card" role="region" aria-label={card.label}>
          <div
            className="summary-card-accent"
            style={{ background: card.accent }}
          />
          <div
            className="summary-card-icon"
            style={{ background: card.iconBg, color: card.iconColor }}
          >
            {card.icon}
          </div>
          <div className="summary-card-label">{card.label}</div>
          <div className="summary-card-value">
            {card.format(stats[card.key] || 0)}
          </div>
        </div>
      ))}
    </section>
  );
}
