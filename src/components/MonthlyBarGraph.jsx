// src/components/MonthlyBarGraph.jsx
import { useState, useMemo } from 'react';
import { formatINR, formatMonthLabel, computeStats } from '../utils/helpers';

/**
 * Format compact INR currency for chart labels (e.g. ₹15.2k or ₹850)
 */
function formatCompactINR(val) {
  if (val === 0) return '₹0';
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${Math.round(val)}`;
}

export default function MonthlyBarGraph({ allExpenses, allMonthKeys, onSelectMonth }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Filter months that actually have expenses and sort chronologically (oldest -> newest for trend)
  const validMonths = useMemo(() => {
    return allMonthKeys
      .filter(k => (allExpenses[k] || []).length > 0)
      .sort((a, b) => a.localeCompare(b)); // chronological
  }, [allMonthKeys, allExpenses]);

  // Monthly data preparation
  const monthlyData = useMemo(() => {
    return validMonths.map(monthKey => {
      const expenses = allExpenses[monthKey] || [];
      const stats = computeStats(expenses);
      return {
        key: monthKey,
        label: formatMonthLabel(monthKey),
        shortLabel: formatMonthLabel(monthKey).split(' ')[0].substring(0, 3) + " '" + monthKey.substring(2, 4),
        total: stats.total,
        count: stats.count,
        average: stats.average,
        highest: stats.highest,
      };
    });
  }, [validMonths, allExpenses]);

  // Overall stats for KPI badges
  const overallStats = useMemo(() => {
    if (monthlyData.length === 0) return { total: 0, highestMonth: null, avgMonthly: 0 };
    const total = monthlyData.reduce((acc, m) => acc + m.total, 0);
    const avgMonthly = total / monthlyData.length;
    let highestMonth = monthlyData[0];
    monthlyData.forEach(m => {
      if (m.total > highestMonth.total) highestMonth = m;
    });
    return { total, highestMonth, avgMonthly };
  }, [monthlyData]);

  // Compute maximum value for scaling the bar heights
  const maxValue = useMemo(() => {
    if (monthlyData.length === 0) return 100;
    const vals = monthlyData.map(item => item.total);
    const max = Math.max(...vals, 0);
    return max > 0 ? max * 1.18 : 100; // 18% head-room for labels above bars
  }, [monthlyData]);

  // Y-axis grid ticks (4 intervals)
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = maxValue / 4;
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(step * i);
      ticks.push({
        value: val,
        label: formatCompactINR(val),
        percent: (i / 4) * 100,
      });
    }
    return ticks;
  }, [maxValue]);

  if (validMonths.length === 0) {
    return null;
  }

  return (
    <div className="monthly-graph-card" id="monthly-history-bargraph">
      {/* Top Header */}
      <div className="graph-card-header">
        <div className="graph-title-group">
          <div className="graph-title-row">
            <span className="graph-icon-wrapper" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <h3 className="graph-heading">Monthly Spending Bar Graph</h3>
            <span className="live-realtime-badge" title="Data automatically syncs in real-time as expenses are added or edited">
              <span className="live-pulse-dot" />
              Realtime
            </span>
          </div>
          <p className="graph-subtitle">
            Comparing all {validMonths.length} recorded {validMonths.length === 1 ? 'month' : 'months'}
          </p>
        </div>
      </div>

      {/* Quick Insights Row */}
      {overallStats.highestMonth && (
        <div className="graph-insights-row">
          <div className="insight-pill">
            <span className="insight-pill-label">Highest Month:</span>
            <strong className="insight-pill-value primary">
              {overallStats.highestMonth.label} ({formatINR(overallStats.highestMonth.total)})
            </strong>
          </div>
          <div className="insight-pill">
            <span className="insight-pill-label">Monthly Average:</span>
            <strong className="insight-pill-value">
              {formatINR(overallStats.avgMonthly)}
            </strong>
          </div>
          <div className="insight-pill">
            <span className="insight-pill-label">Total All-Time:</span>
            <strong className="insight-pill-value success">
              {formatINR(overallStats.total)}
            </strong>
          </div>
        </div>
      )}

      {/* Main Bar Chart Container */}
      <div className="graph-chart-wrapper">
        {/* Y-Axis scale labels */}
        <div className="graph-y-axis" aria-hidden="true">
          {[...yTicks].reverse().map(tick => (
            <div key={tick.value} className="y-tick-label">
              {tick.label}
            </div>
          ))}
        </div>

        {/* Chart Canvas Area */}
        <div className="graph-bars-area" onMouseLeave={() => setActiveTooltip(null)}>
          {/* Grid lines */}
          <div className="graph-grid-lines" aria-hidden="true">
            {yTicks.map(tick => (
              <div
                key={tick.value}
                className={`graph-grid-line ${tick.percent === 0 ? 'baseline' : ''}`}
                style={{ bottom: `${tick.percent}%` }}
              />
            ))}
          </div>

          {/* Average Benchmark Line */}
          {overallStats.avgMonthly > 0 && (
            <div
              className="graph-average-line"
              style={{
                bottom: `${Math.min(95, (overallStats.avgMonthly / maxValue) * 100)}%`,
              }}
              title={`Monthly Average: ${formatINR(overallStats.avgMonthly)}`}
            >
              <span className="average-line-label">Avg {formatCompactINR(overallStats.avgMonthly)}</span>
            </div>
          )}

          {/* Interactive Bars */}
          <div className="graph-bars-flex">
            {monthlyData.map(item => {
              const val = item.total;
              const heightPercent = maxValue > 0 ? Math.max(4, (val / maxValue) * 100) : 4;
              const isHighest = overallStats.highestMonth?.key === item.key;
              const isHovered = activeTooltip?.key === item.key;

              return (
                <div
                  key={item.key}
                  id={`bar-month-${item.key}`}
                  className={`bar-column ${isHighest ? 'highest' : ''} ${isHovered ? 'hovered' : ''}`}
                  onClick={() => onSelectMonth?.(item.key)}
                  onMouseEnter={() => setActiveTooltip(item)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.label}: ${formatINR(item.total)}, ${item.count} items. Click to view month details.`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectMonth?.(item.key);
                    }
                  }}
                >
                  {/* Value Badge above the bar */}
                  <div className="bar-top-value">
                    {formatCompactINR(item.total)}
                  </div>

                  {/* The Bar Track and Fill */}
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="bar-glow-cap" />
                    </div>
                  </div>

                  {/* Month Label below the bar */}
                  <div className="bar-x-label" title={item.label}>
                    <span className="bar-label-month">{item.shortLabel}</span>
                    {isHighest && <span className="bar-highest-tag">Peak</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating / Detail Tooltip Banner */}
      {activeTooltip && (
        <div className="graph-tooltip-banner" role="status">
          <div className="tooltip-header">
            <span className="tooltip-icon">📊</span>
            <strong>{activeTooltip.label}</strong>
            <span className="tooltip-hint">Click bar to view details →</span>
          </div>
          <div className="tooltip-stats-row">
            <div className="tooltip-stat">
              <span>Total Spent:</span>
              <strong className="primary">{formatINR(activeTooltip.total)}</strong>
            </div>
            <div className="tooltip-stat">
              <span>Items Purchased:</span>
              <strong>{activeTooltip.count}</strong>
            </div>
            <div className="tooltip-stat">
              <span>Avg per Item:</span>
              <strong>{formatINR(activeTooltip.average)}</strong>
            </div>
            <div className="tooltip-stat">
              <span>Highest Item:</span>
              <strong>{formatINR(activeTooltip.highest)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="graph-footer-hint">
        💡 <strong>Tip:</strong> Click on any month&apos;s bar to inspect its transactions. Real-time updates automatically reflect added expenses.
      </div>

      <style>{`
        .monthly-graph-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 22px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
          transition: border-color var(--transition), box-shadow var(--transition);
        }
        .monthly-graph-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
        }
        .monthly-graph-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary), #8b5cf6, var(--info));
        }
        .graph-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        .graph-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .graph-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .graph-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .graph-heading {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin: 0;
        }
        .live-realtime-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .live-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulseGreen 2s infinite;
        }
        @keyframes pulseGreen {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        .graph-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .graph-insights-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
          padding: 10px 14px;
          background: var(--surface-2);
          border-radius: var(--radius-md);
          border: 1px dashed var(--border);
        }
        .insight-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .insight-pill-label {
          color: var(--text-muted);
        }
        .insight-pill-value {
          font-weight: 700;
          color: var(--text-primary);
        }
        .insight-pill-value.primary { color: var(--primary); }
        .insight-pill-value.success { color: var(--success); }

        /* Chart Canvas */
        .graph-chart-wrapper {
          display: flex;
          position: relative;
          height: 270px;
          margin-top: 8px;
          margin-bottom: 12px;
          padding-top: 20px;
        }
        .graph-y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-right: 12px;
          padding-bottom: 36px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          user-select: none;
          text-align: right;
          min-width: 48px;
        }
        .y-tick-label {
          line-height: 1;
        }
        .graph-bars-area {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border-left: 1px solid var(--border);
          padding-bottom: 36px;
        }
        .graph-grid-lines {
          position: absolute;
          left: 0; right: 0;
          top: 0;
          bottom: 36px;
          pointer-events: none;
        }
        .graph-grid-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          border-bottom: 1px dashed var(--border);
          opacity: 0.8;
        }
        .graph-grid-line.baseline {
          border-bottom: 1.5px solid var(--border-strong);
          opacity: 1;
        }
        .graph-average-line {
          position: absolute;
          left: 0; right: 0;
          height: 1.5px;
          border-bottom: 2px dotted #8b5cf6;
          pointer-events: none;
          z-index: 3;
          display: flex;
          justify-content: flex-end;
        }
        .average-line-label {
          background: #8b5cf6;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          transform: translateY(-50%);
          margin-right: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        .graph-bars-flex {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 100%;
          width: 100%;
          padding: 0 8px;
          position: relative;
          z-index: 2;
          overflow-x: auto;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }

        .bar-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
          flex: 1;
          max-width: 72px;
          min-width: 44px;
          cursor: pointer;
          position: relative;
          padding: 0 6px;
          transition: transform 0.18s ease;
        }
        .bar-column:focus {
          outline: none;
        }
        .bar-column:focus-visible .bar-fill {
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.4);
        }
        .bar-column:hover {
          transform: translateY(-3px);
        }

        .bar-top-value {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 6px;
          white-space: nowrap;
          transition: color var(--transition);
        }
        .bar-column:hover .bar-top-value,
        .bar-column.hovered .bar-top-value {
          color: var(--primary);
        }

        .bar-track {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .bar-fill {
          width: 100%;
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          background: linear-gradient(180deg, #6366f1 0%, #4f46e5 100%);
          position: relative;
          transition: height 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
        }
        .bar-glow-cap {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.55);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        }

        .bar-column.highest .bar-fill {
          background: linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%);
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
        }
        .bar-column:hover .bar-fill,
        .bar-column.hovered .bar-fill {
          background: linear-gradient(180deg, #4338ca 0%, #3730a3 100%);
          box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);
        }
        .bar-column.highest:hover .bar-fill,
        .bar-column.highest.hovered .bar-fill {
          background: linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%);
        }

        .bar-x-label {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          padding-top: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          user-select: none;
        }
        .bar-label-month {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .bar-highest-tag {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          background: #fef3c7;
          color: #b45309;
          border-radius: 4px;
          padding: 1px 4px;
          line-height: 1;
        }

        /* Tooltip Banner */
        .graph-tooltip-banner {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-left: 3px solid var(--primary);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          margin-top: 14px;
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tooltip-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .tooltip-hint {
          margin-left: auto;
          font-size: 11px;
          font-weight: 600;
          color: var(--primary);
        }
        .tooltip-stats-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 12px;
        }
        .tooltip-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
        }
        .tooltip-stat strong {
          color: var(--text-primary);
        }
        .tooltip-stat strong.primary {
          color: var(--primary);
        }

        .graph-footer-hint {
          margin-top: 12px;
          font-size: 12px;
          color: var(--text-muted);
          border-top: 1px solid var(--border);
          padding-top: 10px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 680px) {
          .monthly-graph-card {
            padding: 16px 12px;
            border-radius: var(--radius-lg);
          }
          .graph-insights-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            padding: 10px;
          }
          .insight-pill {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
          .insight-pill:last-child {
            grid-column: 1 / -1;
          }
          .graph-chart-wrapper {
            height: 230px;
            padding-top: 18px;
          }
          .graph-y-axis {
            min-width: 42px;
            font-size: 10px;
            padding-right: 6px;
          }
          .bar-column {
            min-width: 38px;
            padding: 0 4px;
          }
          .tooltip-stats-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }

        /* 325px Compact Device Support */
        @media (max-width: 420px) {
          .monthly-graph-card {
            padding: 12px 8px;
          }
          .graph-title-row {
            flex-wrap: wrap;
            gap: 6px;
          }
          .graph-heading {
            font-size: 15px;
          }
          .live-realtime-badge {
            font-size: 10px;
            padding: 2px 6px;
          }
          .graph-subtitle {
            font-size: 11px;
          }
          .graph-insights-row {
            grid-template-columns: 1fr;
            gap: 6px;
            padding: 8px;
          }
          .insight-pill {
            flex-direction: row;
            justify-content: space-between;
            font-size: 11px;
          }
          .graph-chart-wrapper {
            height: 210px;
          }
          .graph-y-axis {
            min-width: 36px;
            font-size: 9px;
            padding-right: 4px;
            padding-bottom: 32px;
          }
          .graph-bars-area {
            padding-bottom: 32px;
          }
          .graph-grid-lines {
            bottom: 32px;
          }
          .bar-column {
            min-width: 32px;
            padding: 0 2px;
          }
          .bar-top-value {
            font-size: 9px;
          }
          .bar-label-month {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
}
