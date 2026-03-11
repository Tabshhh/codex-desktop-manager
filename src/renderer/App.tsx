import { useEffect, useState } from 'react';
import AccountList from './components/AccountList';
import ActionBar from './components/ActionBar';
import CurrentStatusPanel from './components/CurrentStatusPanel';
import { useAccounts } from './hooks/useAccounts';
import './styles.css';

function App() {
  const [captureLabel, setCaptureLabel] = useState('');
  const [activePage, setActivePage] = useState<'pool' | 'status'>('pool');
  const {
    accounts,
    selectedAccount,
    selectedId,
    setSelectedId,
    usage,
    desktopInfo,
    loading,
    busyAction,
    error,
    bridgeAvailable,
    captureCurrentAccount,
    switchToSnapshot,
    refreshSnapshotUsage,
    deleteSnapshot,
    refreshAllSnapshotUsage,
    restoreLastBackup
  } = useAccounts();

  useEffect(() => {
    if (!captureLabel && selectedAccount) {
      setCaptureLabel(`${selectedAccount.label} Copy`);
    }
  }, [captureLabel, selectedAccount]);

  async function handleCapture() {
    const label = captureLabel.trim() || 'Captured Account';
    await captureCurrentAccount(label);
    setCaptureLabel('');
  }

  return (
    <main className="app-shell">
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="top-bar">
        <nav aria-label="Primary" className="page-tabs" role="tablist">
          <button
            aria-selected={activePage === 'pool'}
            className={`page-tab${activePage === 'pool' ? ' page-tab-active' : ''}`}
            onClick={() => setActivePage('pool')}
            role="tab"
            type="button"
          >
            Account Pool
          </button>
          <button
            aria-selected={activePage === 'status'}
            className={`page-tab${activePage === 'status' ? ' page-tab-active' : ''}`}
            onClick={() => setActivePage('status')}
            role="tab"
            type="button"
          >
            Current Account Status
          </button>
        </nav>

        {desktopInfo ? (
          <div className="desktop-meta-badges" data-testid="desktop-meta-badges">
            <span className="desktop-meta-badge">{`v${desktopInfo.version}`}</span>
            <span className="desktop-meta-badge desktop-meta-badge-muted">
              {desktopInfo.platform.switchingSupported
                ? `${desktopInfo.platform.label} support enabled`
                : desktopInfo.platform.reason ?? `${desktopInfo.platform.label} support unavailable`}
            </span>
          </div>
        ) : null}
      </div>

      <section className="page-panel">
        {activePage === 'pool' ? (
          <div className="workspace-grid">
            <AccountList
              accounts={accounts}
              busyAction={busyAction}
              currentAccountEmail={usage?.accountEmail ?? null}
              currentAccountSubject={usage?.accountSubject ?? null}
              onDelete={deleteSnapshot}
              onRefreshQuota={refreshSnapshotUsage}
              onSelect={setSelectedId}
              onSwitch={switchToSnapshot}
              selectedId={selectedId}
            />
            <ActionBar
              busyAction={busyAction}
              bridgeAvailable={bridgeAvailable}
              captureLabel={captureLabel}
              onCapture={() => void handleCapture()}
              onLabelChange={setCaptureLabel}
              onRefreshAll={() => void refreshAllSnapshotUsage()}
              onRestore={() => void restoreLastBackup()}
            />
          </div>
        ) : (
          <CurrentStatusPanel usage={usage} />
        )}
      </section>

      {loading ? <div className="loading-pill">Loading local Codex data...</div> : null}
    </main>
  );
}

export default App;
