interface QuotaProgressProps {
  label: string;
  value: number | null;
  tone?: 'cool' | 'warm';
  ariaLabel: string;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return 'Unknown';
  }

  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function QuotaProgress({ label, value, tone = 'cool', ariaLabel }: QuotaProgressProps) {
  const normalizedValue = value === null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div className="quota-progress">
      <div className="quota-progress-header">
        <span>{label}</span>
        <strong className="quota-value">{formatPercent(value)}</strong>
      </div>
      <div
        aria-label={ariaLabel}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(normalizedValue)}
        className="quota-track"
        role="progressbar"
      >
        <div className={`quota-fill quota-fill-${tone}`} style={{ width: `${normalizedValue}%` }} />
      </div>
    </div>
  );
}

export default QuotaProgress;
