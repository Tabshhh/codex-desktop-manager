interface ActionBarProps {
  captureLabel: string;
  busyAction: string | null;
  bridgeAvailable: boolean;
  onLabelChange(value: string): void;
  onCapture(): void;
  onRefreshAll(): void;
  onRestore(): void;
}

function ActionBar({ captureLabel, busyAction, bridgeAvailable, onLabelChange, onCapture, onRefreshAll, onRestore }: ActionBarProps) {
  return (
    <section className="panel action-panel">
      <div className="panel-heading">
        <p className="eyebrow">Actions</p>
        <h2>Account Pool Controls</h2>
      </div>
      <label className="field">
        <span>Snapshot label</span>
        <input
          aria-label="Snapshot label"
          disabled={!bridgeAvailable}
          onChange={(event) => onLabelChange(event.target.value)}
          placeholder="Work, Personal, Client A..."
          type="text"
          value={captureLabel}
        />
      </label>
      <div className="action-row">
        <button className="primary-button" disabled={!bridgeAvailable || busyAction === 'capture'} onClick={onCapture} type="button">
          {busyAction === 'capture' ? 'Capturing...' : 'Capture current'}
        </button>
        <button className="ghost-button" disabled={!bridgeAvailable || busyAction === 'refresh-all'} onClick={onRefreshAll} type="button">
          {busyAction === 'refresh-all' ? 'Refreshing all...' : 'Refresh all quotas'}
        </button>
        <button className="ghost-button" disabled={!bridgeAvailable || busyAction === 'restore'} onClick={onRestore} type="button">
          {busyAction === 'restore' ? 'Restoring...' : 'Rollback last switch'}
        </button>
      </div>
    </section>
  );
}

export default ActionBar;
