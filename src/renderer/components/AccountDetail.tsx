import type { LocalUsageSummary, SnapshotManifest } from '@shared/types';

interface AccountDetailProps {
  account: SnapshotManifest | null;
  usage: LocalUsageSummary | null;
}

function formatTime(value: string | null) {
  if (!value) {
    return 'Unknown';
  }

  return new Date(value).toLocaleString();
}

function AccountDetail({ account, usage }: AccountDetailProps) {
  if (!account) {
    return (
      <section className="panel detail-panel">
        <div className="panel-heading">
          <p className="eyebrow">Status</p>
          <h2>Capture an account to begin</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="panel detail-panel">
      <div className="panel-heading">
        <p className="eyebrow">Current selection</p>
        <h2>{account.label}</h2>
      </div>
      <div className="detail-grid">
        <div>
          <span className="detail-label">Email</span>
          <strong>{account.account.email}</strong>
        </div>
        <div>
          <span className="detail-label">Plan</span>
          <strong>{account.account.plan}</strong>
        </div>
        <div>
          <span className="detail-label">Auth mode</span>
          <strong>{account.account.authMode}</strong>
        </div>
        <div>
          <span className="detail-label">Last refresh</span>
          <strong>{formatTime(account.account.lastRefresh)}</strong>
        </div>
        <div>
          <span className="detail-label">Token expiry</span>
          <strong>{formatTime(account.account.tokenExpiry)}</strong>
        </div>
        <div>
          <span className="detail-label">Local status</span>
          <strong>{usage?.statusLabel ?? 'Unknown'}</strong>
        </div>
      </div>
      <p className="footnote">
        This is a local-visible status summary, not official billing remaining quota.
      </p>
    </section>
  );
}

export default AccountDetail;
