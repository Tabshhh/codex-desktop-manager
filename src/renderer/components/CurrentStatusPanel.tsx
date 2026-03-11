import type { LocalUsageSummary } from '@shared/types';
import QuotaProgress from './QuotaProgress';

interface CurrentStatusPanelProps {
  usage: LocalUsageSummary | null;
}

function formatTime(value: string | null) {
  if (!value) {
    return 'Unknown';
  }

  return new Date(value).toLocaleString();
}

function formatPlan(value: string | null) {
  if (!value) {
    return 'Unavailable';
  }

  return value;
}

function CurrentStatusPanel({ usage }: CurrentStatusPanelProps) {
  return (
    <section className="panel current-status-panel">
      <div className="panel-heading">
        <p className="eyebrow">Live Desktop</p>
        <h2>Current Live Codex Status</h2>
      </div>
      <div className="status-summary-grid">
        <div className="status-summary-card">
          <span className="detail-label">Plan</span>
          <strong>{formatPlan(usage?.quotaPlanType ?? null)}</strong>
        </div>
        <div className="status-summary-card">
          <span className="detail-label">Quota updated</span>
          <strong>{formatTime(usage?.quotaCapturedAt ?? usage?.lastRefresh ?? null)}</strong>
        </div>
        <div className="status-summary-card">
          <span className="detail-label">5h reset</span>
          <strong>{formatTime(usage?.fiveHourResetsAt ?? null)}</strong>
        </div>
        <div className="status-summary-card">
          <span className="detail-label">Weekly reset</span>
          <strong>{formatTime(usage?.weeklyResetsAt ?? null)}</strong>
        </div>
      </div>
      <div className="current-status-bars">
        <QuotaProgress ariaLabel="Current 5h remaining" label="Current 5h remaining" tone="cool" value={usage?.fiveHourRemainingPercent ?? null} />
        <QuotaProgress
          ariaLabel="Current weekly remaining"
          label="Current weekly remaining"
          tone="warm"
          value={usage?.weeklyRemainingPercent ?? null}
        />
      </div>
    </section>
  );
}

export default CurrentStatusPanel;
