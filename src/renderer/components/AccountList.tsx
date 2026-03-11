import { useState } from 'react';
import type { SnapshotManifest } from '@shared/types';
import QuotaProgress from './QuotaProgress';

interface AccountListProps {
  accounts: SnapshotManifest[];
  selectedId: string | null;
  busyAction: string | null;
  currentAccountEmail: string | null;
  currentAccountSubject: string | null;
  onSelect(snapshotId: string): void;
  onSwitch(snapshotId: string): void;
  onRefreshQuota(snapshotId: string): void;
  onDelete(snapshotId: string): void;
}

function formatQuotaMeta(snapshot: SnapshotManifest) {
  if (!snapshot.quota) {
    return 'Use Refresh quota to fetch real usage for this account.';
  }

  return `Updated ${new Date(snapshot.quota.refreshedAt).toLocaleString()}`;
}

function resolvePlanLabel(snapshot: SnapshotManifest) {
  if (snapshot.quota?.planType) {
    return snapshot.quota.planType;
  }

  return snapshot.account.plan !== 'Unknown' ? snapshot.account.plan : null;
}

function isCurrentSnapshot(snapshot: SnapshotManifest, currentAccountEmail: string | null, currentAccountSubject: string | null) {
  if (currentAccountSubject && snapshot.account.subject) {
    return currentAccountSubject === snapshot.account.subject;
  }

  return Boolean(currentAccountEmail && currentAccountEmail === snapshot.account.email);
}

function formatResetTime(value: string | null) {
  if (!value) {
    return 'Unknown';
  }

  return new Date(value).toLocaleString();
}

function ResetMeta({
  label,
  value,
  testId
}: {
  label: string;
  value: string | null;
  testId: string;
}) {
  return (
    <p className="quota-meta">
      <span>{`${label} `}</span>
      <span className="quota-meta-value" data-testid={testId}>
        {formatResetTime(value)}
      </span>
    </p>
  );
}

function AccountList({
  accounts,
  selectedId,
  busyAction,
  currentAccountEmail,
  currentAccountSubject,
  onSelect,
  onSwitch,
  onRefreshQuota,
  onDelete
}: AccountListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
          const refreshing = busyAction === `refresh:${snapshot.id}`;
          const deleting = busyAction === `delete:${snapshot.id}`;
          const batchRefreshing = busyAction === 'refresh-all';
          const current = isCurrentSnapshot(snapshot, currentAccountEmail, currentAccountSubject);
          const planLabel = resolvePlanLabel(snapshot);
          const deleteArmed = pendingDeleteId === snapshot.id;

          return (
            <article
              className={`account-card${active ? ' account-card-active' : ''}${current ? ' account-card-current' : ''}`}
              data-testid={`account-card-${snapshot.id}`}
              key={snapshot.id}
              onClick={() => onSelect(snapshot.id)}
            >
              <div className="account-card-info" data-testid={`account-info-${snapshot.id}`}>
                <div className="account-card-title-row">
                  <div className="account-card-title-group">
                    <h3 className={current ? 'account-card-name account-card-name-current' : 'account-card-name'}>{snapshot.label}</h3>
                    {current ? (
                      <span className="current-account-badge" data-testid={`current-account-marker-${snapshot.id}`}>
                        LIVE
                      </span>
                    ) : null}
                  </div>
                  {planLabel ? <span className="pill">{planLabel}</span> : null}
                </div>
                <p>{snapshot.account.email}</p>
                <p className="quota-meta">{formatQuotaMeta(snapshot)}</p>
              </div>
              <div className="account-card-action-slot" data-testid={`account-refresh-${snapshot.id}`}>
                <button
                  className="ghost-button"
                  disabled={batchRefreshing}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRefreshQuota(snapshot.id);
                  }}
                  type="button"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh quota'}
                </button>
              </div>
              <div className="account-card-action-slot" data-testid={`account-switch-${snapshot.id}`}>
                <button
                  className="ghost-button"
                  disabled={batchRefreshing || deleting}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSwitch(snapshot.id);
                  }}
                  type="button"
                >
                  {switching ? 'Switching...' : 'Switch'}
                </button>
              </div>
              <div className="account-card-action-slot" data-testid={`account-delete-${snapshot.id}`}>
                <button
                  className={`ghost-button${deleteArmed ? ' danger-button' : ''}`}
                  disabled={batchRefreshing || refreshing || switching}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!deleteArmed) {
                      setPendingDeleteId(snapshot.id);
                      return;
                    }

                    setPendingDeleteId(null);
                    onDelete(snapshot.id);
                  }}
                  type="button"
                >
                  {deleting ? 'Deleting...' : deleteArmed ? 'Confirm delete' : 'Delete'}
                </button>
              </div>
              <div className="quota-bars" data-testid={`account-quota-grid-${snapshot.id}`}>
                <QuotaProgress
                  ariaLabel="5h remaining"
                  label="5h remaining"
                  tone="cool"
                  value={snapshot.quota?.fiveHourRemainingPercent ?? null}
                />
                <QuotaProgress
                  ariaLabel="Weekly remaining"
                  label="Weekly remaining"
                  tone="warm"
                  value={snapshot.quota?.weeklyRemainingPercent ?? null}
                />
              </div>
              <div className="quota-reset-grid">
                <ResetMeta
                  label="5h reset"
                  testId={`account-reset-five-value-${snapshot.id}`}
                  value={snapshot.quota?.fiveHourResetsAt ?? null}
                />
                <ResetMeta
                  label="Weekly reset"
                  testId={`account-reset-weekly-value-${snapshot.id}`}
                  value={snapshot.quota?.weeklyResetsAt ?? null}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default AccountList;
