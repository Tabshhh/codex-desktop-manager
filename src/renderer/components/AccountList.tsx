import type { SnapshotManifest } from '@shared/types';

interface AccountListProps {
  accounts: SnapshotManifest[];
  selectedId: string | null;
  busyAction: string | null;
  onSelect(snapshotId: string): void;
  onSwitch(snapshotId: string): void;
}

function AccountList({ accounts, selectedId, busyAction, onSelect, onSwitch }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <section className="panel panel-empty">
        <h2>No snapshots yet</h2>
        <p>Capture the current Codex account to create your first one-click switch target.</p>
      </section>
    );
  }

  return (
    <section className="panel account-list-panel">
      <div className="panel-heading">
        <p className="eyebrow">Snapshots</p>
        <h2>Saved accounts</h2>
      </div>
      <div className="account-list">
        {accounts.map((snapshot) => {
          const active = snapshot.id === selectedId;
          const switching = busyAction === `switch:${snapshot.id}`;

          return (
            <article
              className={`account-card${active ? ' account-card-active' : ''}`}
              key={snapshot.id}
              onClick={() => onSelect(snapshot.id)}
            >
              <div>
                <h3>{snapshot.label}</h3>
                <p>{snapshot.account.email}</p>
              </div>
              <div className="account-card-meta">
                <span className="pill">{snapshot.account.plan}</span>
                <button
                  className="ghost-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSwitch(snapshot.id);
                  }}
                  type="button"
                >
                  {switching ? 'Switching...' : 'Switch'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default AccountList;
