// src/components/MonthlyHistory.jsx
import { useState, useMemo } from 'react';
import { formatINR, formatMonthLabel, computeStats } from '../utils/helpers';
import MonthDetails from './MonthDetails';
import SummaryCards from './SummaryCards';
import MonthlyBarGraph from './MonthlyBarGraph';

export default function MonthlyHistory({ allExpenses, allMonthKeys }) {
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Filter out months that have no data (edge case)
  const validMonths = allMonthKeys.filter(k => (allExpenses[k] || []).length > 0);

  // Compute aggregate stats across all months in history
  const allHistoryExpenses = useMemo(() => {
    return validMonths.flatMap(k => allExpenses[k] || []);
  }, [validMonths, allExpenses]);

  const historyStats = useMemo(() => {
    return computeStats(allHistoryExpenses);
  }, [allHistoryExpenses]);

  if (selectedMonth) {
    const monthExpenses = allExpenses[selectedMonth] || [];
    return (
      <MonthDetails
        monthKey={selectedMonth}
        expenses={monthExpenses}
        onBack={() => setSelectedMonth(null)}
      />
    );
  }

  if (validMonths.length === 0) {
    return (
      <div className="history-empty">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 14 }} aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
          No History Yet
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Add expenses in the <strong>Current Month</strong> tab and they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div id="panel-history">
      {/* Average Expense & Highest Expense Summary Cards in Monthly History */}
      <SummaryCards
        stats={historyStats}
        cardKeys={['average', 'highest']}
      />

      {/* Realtime Bar Graph Visualization */}
      <MonthlyBarGraph
        allExpenses={allExpenses}
        allMonthKeys={allMonthKeys}
        onSelectMonth={(monthKey) => setSelectedMonth(monthKey)}
      />

      <div className="section-title" style={{ marginBottom: 18 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        Monthly History
        <span>{validMonths.length} {validMonths.length === 1 ? 'month' : 'months'}</span>
      </div>

      <div className="history-grid">
        {validMonths.map(monthKey => {
          const expenses = allExpenses[monthKey] || [];
          const stats = computeStats(expenses);
          return (
            <button
              key={monthKey}
              id={`history-month-${monthKey}`}
              className="history-card"
              onClick={() => setSelectedMonth(monthKey)}
              aria-label={`View expenses for ${formatMonthLabel(monthKey)}`}
            >
              <div className="history-card-month">
                {formatMonthLabel(monthKey)}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
              <div className="history-card-stats">
                <div className="history-stat">
                  <span>Total Expense</span>
                  <span className="history-stat-value primary">{formatINR(stats.total)}</span>
                </div>
                <div className="history-stat">
                  <span>Total Products</span>
                  <span className="history-stat-value">{stats.count}</span>
                </div>
                <div className="history-stat">
                  <span>Average Expense</span>
                  <span className="history-stat-value">{formatINR(stats.average)}</span>
                </div>
                <div className="history-stat">
                  <span>Highest Expense</span>
                  <span className="history-stat-value">{formatINR(stats.highest)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
