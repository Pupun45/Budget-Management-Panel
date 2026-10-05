// src/components/Header.jsx
import { formatMonthLabel, getCurrentMonthKey } from '../utils/helpers';

export default function Header() {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <div className="header-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <div className="header-text">
          <h1>Monthly Budget Panel</h1>
          <p>{formatMonthLabel(getCurrentMonthKey())}</p>
        </div>
        <div className="header-date" role="status" aria-label="Today's date">
          {dateLabel}
        </div>
      </div>
    </header>
  );
}
