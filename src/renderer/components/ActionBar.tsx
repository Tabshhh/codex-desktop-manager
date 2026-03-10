interface ActionBarProps {
  captureLabel: string;
  busyAction: string | null;
  onLabelChange(value: string): void;
  onCapture(): void;
  onRestore(): void;
}

function ActionBar({ captureLabel, busyAction, onLabelChange, onCapture, onRestore }: ActionBarProps) {
  return (
    <section className="panel action-panel">
      <div className="panel-heading">
        <p className="eyebrow">Actions</p>
        <h2>Manage local snapshots</h2>
      </div>
      <label className="field">
        <span>Snapshot label</span>
        <input
          aria-label="Snapshot label"
          onChange={(event) => onLabelChange(event.target.value)}
          placeholder="Work, Personal, Client A..."
          type="text"
          value={captureLabel}
        />
      </label>
      <div className="action-row">
        <button className="primary-button" disabled={busyAction === 'capture'} onClick={onCapture} type="button">
          {busyAction === 'capture' ? 'Capturing...' : 'Capture current'}
        </button>
        <button className="ghost-button" disabled={busyAction === 'restore'} onClick={onRestore} type="button">
          {busyAction === 'restore' ? 'Restoring...' : 'Rollback last switch'}
        </button>
      </div>
    </section>
  );
}

export default ActionBar;
