import { useEffect, useState } from 'react';
import AccountDetail from './components/AccountDetail';
import AccountList from './components/AccountList';
import ActionBar from './components/ActionBar';
import { useAccounts } from './hooks/useAccounts';
import './styles.css';

function App() {
  const [captureLabel, setCaptureLabel] = useState('');
  const {
    accounts,
    selectedAccount,
    selectedId,
    setSelectedId,
    usage,
    loading,
    busyAction,
    error,
    captureCurrentAccount,
    switchToSnapshot,
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
      <section className="hero-card hero-card-wide">
        <div>
          <p className="eyebrow">Codex Desktop</p>
          <h1>Account Switcher</h1>
          <p className="subtitle">One-click local account switching with backup, rollback, and a local-visible usage summary.</p>
        </div>
        {usage ? (
          <aside className={`usage-banner usage-${usage.freshness}`}>
            <span>{usage.statusLabel}</span>
            <strong>{usage.freshness.toUpperCase()}</strong>
          </aside>
        ) : null}
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace-grid">
        <AccountList
          accounts={accounts}
          busyAction={busyAction}
          onSelect={setSelectedId}
          onSwitch={switchToSnapshot}
          selectedId={selectedId}
        />
        <div className="stack-column">
          <ActionBar
            busyAction={busyAction}
            captureLabel={captureLabel}
            onCapture={() => void handleCapture()}
            onLabelChange={setCaptureLabel}
            onRestore={() => void restoreLastBackup()}
          />
          <AccountDetail account={selectedAccount} usage={usage} />
        </div>
      </section>

      {loading ? <div className="loading-pill">Loading local Codex data...</div> : null}
    </main>
  );
}

export default App;
