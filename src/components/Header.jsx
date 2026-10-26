// src/components/Header.jsx
import { formatMonthLabel, getCurrentMonthKey } from '../utils/helpers';

export default function Header({ dbStatus = 'connected' }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div className="header-text">
            <h1>Budget Panel</h1>
            <p>{formatMonthLabel(getCurrentMonthKey())}</p>
          </div>
        </div>

        <div className="header-meta-group">
          {/* MongoDB Atlas Status Badge */}
          <div
            className={`db-status-badge ${dbStatus}`}
            title={
              dbStatus === 'connected'
                ? 'MongoDB Atlas (BudgePlan) Connected & Synced'
                : dbStatus === 'connecting'
                ? 'Connecting to MongoDB Atlas...'
                : 'Offline fallback (local storage active)'
            }
          >
            <span className="db-status-dot" />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            <span className="db-status-text">
              {dbStatus === 'connected' ? 'MongoDB Atlas' : dbStatus === 'connecting' ? 'Connecting...' : 'Local Cache'}
            </span>
          </div>

          <div className="header-date" role="status" aria-label="Today's date">
            {dateLabel}
          </div>
        </div>
      </div>

      <style>{`
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 16px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .header-meta-group {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .db-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          transition: all var(--transition);
          user-select: none;
          white-space: nowrap;
        }
        .db-status-badge.connected {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        .db-status-badge.connecting {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .db-status-badge.offline {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }
        .db-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          flex-shrink: 0;
        }
        .db-status-badge.connected .db-status-dot {
          background: #10b981;
          animation: pulseGreen 2s infinite;
        }
        .db-status-badge.connecting .db-status-dot {
          background: #f59e0b;
        }
        .db-status-badge.offline .db-status-dot {
          background: #94a3b8;
        }

        @media (max-width: 650px) {
          .header-inner {
            padding: 10px 12px;
          }
          .header-date {
            display: none;
          }
          .header-text h1 {
            font-size: 15px;
          }
          .header-text p {
            font-size: 11px;
          }
          .header-icon {
            width: 32px;
            height: 32px;
          }
          .header-icon svg {
            width: 18px;
            height: 18px;
          }
        }

        @media (max-width: 380px) {
          .header-inner {
            padding: 8px 10px;
            gap: 6px;
          }
          .header-text h1 {
            font-size: 14px;
          }
          .db-status-badge {
            padding: 3px 7px;
            font-size: 10px;
            gap: 4px;
          }
          .db-status-badge svg {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
