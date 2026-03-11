import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.codexSwitcher = {
      listSnapshots: vi.fn(async () => [
        {
          id: 'snap-3',
          label: 'Charlie Reserve',
          createdAt: '2026-03-10T11:00:00.000Z',
          updatedAt: '2026-03-10T11:00:00.000Z',
          account: {
            email: 'charlie@example.com',
            displayName: 'Charlie',
            authMode: 'chatgpt',
            plan: 'team',
            subject: 'sub-3',
            lastRefresh: '2026-03-10T11:19:31.445Z',
            tokenExpiry: '2026-03-10T14:19:31.445Z',
            hasApiKey: false
          },
          quota: {
            source: 'remote_usage_api',
            refreshedAt: '2026-03-11T11:06:00.000Z',
            authStatus: 'ok',
            planType: 'team',
            fiveHourUsedPercent: 20,
            fiveHourRemainingPercent: 80,
            fiveHourWindowSeconds: 18000,
            fiveHourResetsAt: '2026-03-11T15:49:45.000Z',
            weeklyUsedPercent: 60,
            weeklyRemainingPercent: 40,
            weeklyWindowSeconds: 604800,
            weeklyResetsAt: '2026-03-17T10:49:45.000Z'
          }
        },
        {
          id: 'snap-4',
          label: 'Dana Empty',
          createdAt: '2026-03-10T12:00:00.000Z',
          updatedAt: '2026-03-10T12:00:00.000Z',
          account: {
            email: 'dana@example.com',
            displayName: 'Dana',
            authMode: 'chatgpt',
            plan: 'team',
            subject: 'sub-4',
            lastRefresh: '2026-03-10T12:19:31.445Z',
            tokenExpiry: '2026-03-10T15:19:31.445Z',
            hasApiKey: false
          },
          quota: null
        },
        {
          id: 'snap-1',
          label: 'Alice Work',
          createdAt: '2026-03-10T09:00:00.000Z',
          updatedAt: '2026-03-10T09:00:00.000Z',
          account: {
            email: 'alice@example.com',
            displayName: 'Alice',
            authMode: 'chatgpt',
            plan: 'pro',
            subject: 'sub-1',
            lastRefresh: '2026-03-10T09:19:31.445Z',
            tokenExpiry: '2026-03-10T12:19:31.445Z',
            hasApiKey: false
          },
          quota: {
            source: 'remote_usage_api',
            refreshedAt: '2026-03-11T11:00:00.000Z',
            authStatus: 'ok',
            planType: 'team',
            fiveHourUsedPercent: 78,
            fiveHourRemainingPercent: 22,
            fiveHourWindowSeconds: 18000,
            fiveHourResetsAt: '2026-03-11T14:19:45.000Z',
            weeklyUsedPercent: 23,
            weeklyRemainingPercent: 77,
            weeklyWindowSeconds: 604800,
            weeklyResetsAt: '2026-03-17T09:19:45.000Z'
          }
        },
        {
          id: 'snap-2',
          label: 'Bob Client',
          createdAt: '2026-03-10T10:00:00.000Z',
          updatedAt: '2026-03-10T10:00:00.000Z',
          account: {
            email: 'bob@example.com',
            displayName: 'Bob',
            authMode: 'chatgpt',
            plan: 'team',
            subject: 'sub-2',
            lastRefresh: '2026-03-10T10:19:31.445Z',
            tokenExpiry: '2026-03-10T13:19:31.445Z',
            hasApiKey: false
          },
          quota: {
            source: 'remote_usage_api',
            refreshedAt: '2026-03-11T11:05:00.000Z',
            authStatus: 'ok',
            planType: 'team',
            fiveHourUsedPercent: 45,
            fiveHourRemainingPercent: 55,
            fiveHourWindowSeconds: 18000,
            fiveHourResetsAt: '2026-03-11T15:19:45.000Z',
            weeklyUsedPercent: 32,
            weeklyRemainingPercent: 68,
            weeklyWindowSeconds: 604800,
            weeklyResetsAt: '2026-03-17T10:19:45.000Z'
          }
        }
      ]),
      captureCurrentAccount: vi.fn(async (label: string) => ({ id: label })),
      switchToSnapshot: vi.fn(async (id: string) => ({ id })),
      restoreLastBackup: vi.fn(async () => ({ email: 'restored@example.com' })),
      readDesktopInfo: vi.fn(async () => ({
        productName: 'Codex Desktop Manager',
        version: '0.1.0',
        platform: {
          id: 'win32',
          label: 'Windows',
          switchingSupported: true,
          reason: null
        }
      })),
      readLocalUsage: vi.fn(async () => ({
        statusLabel: 'Plan: pro · 5h left 22% · week left 77%',
        freshness: 'fresh',
        accountEmail: 'alice@example.com',
        accountSubject: 'sub-1',
        lastRefresh: '2026-03-10T09:19:31.445Z',
        tokenExpiry: '2026-03-10T12:19:31.445Z',
        recentSessionCount: 4,
        recentLogCount: 2,
        quotaSource: 'session_rate_limits',
        quotaCapturedAt: '2026-03-10T13:47:09.981Z',
        quotaPlanType: 'team',
        fiveHourUsedPercent: 78,
        fiveHourRemainingPercent: 22,
        fiveHourWindowMinutes: 300,
        fiveHourResetsAt: '2026-03-10T14:19:45.000Z',
        weeklyUsedPercent: 23,
        weeklyRemainingPercent: 77,
        weeklyWindowMinutes: 10080,
        weeklyResetsAt: '2026-03-17T09:19:45.000Z'
      })),
      refreshSnapshotUsage: vi.fn(async (snapshotId: string) => {
        if (snapshotId === 'snap-1') {
          throw new Error('refresh failed');
        }

        return { id: snapshotId };
      }),
      deleteSnapshot: vi.fn(async (snapshotId: string) => ({ id: snapshotId }))
    };
  });

  it('splits the app into pages, sorts accounts by practical remaining quota, and supports refresh-all quota actions', async () => {
    render(<App />);

    expect(screen.queryByText(/codex desktop/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /account switcher/i })).not.toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /account pool/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /current account status/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /saved accounts/i })).toBeInTheDocument();
    expect(screen.queryByText(/current selection/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capture current/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh all quotas/i })).toBeInTheDocument();
    expect(screen.getByTestId('desktop-meta-badges')).toBeInTheDocument();
    expect(screen.getByText(/^v0\.1\.0$/i)).toBeInTheDocument();
    expect(screen.getByText(/windows support enabled/i)).toBeInTheDocument();
    expect(screen.getByTestId('account-card-snap-1')).toBeInTheDocument();
    expect(screen.getByTestId('account-info-snap-1')).toBeInTheDocument();
    expect(screen.getByTestId('account-refresh-snap-1')).toBeInTheDocument();
    expect(screen.getByTestId('account-switch-snap-1')).toBeInTheDocument();
    expect(screen.getByTestId('current-account-marker-snap-1')).toHaveTextContent(/live/i);
    expect(screen.getByTestId('account-quota-grid-snap-1')).toBeInTheDocument();
    expect(within(screen.getByTestId('account-card-snap-1')).getByText(/5h reset/i)).toBeInTheDocument();
    expect(within(screen.getByTestId('account-card-snap-1')).getByText(/weekly reset/i)).toBeInTheDocument();
    expect(within(screen.getByTestId('account-card-snap-1')).getByTestId('account-reset-five-value-snap-1')).toBeInTheDocument();
    expect(within(screen.getByTestId('account-card-snap-1')).getByTestId('account-reset-weekly-value-snap-1')).toBeInTheDocument();
    expect(within(screen.getByTestId('account-card-snap-1')).getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    expect(screen.getByTestId('account-card-snap-1')).not.toHaveTextContent(/5h left 22% · week used 23%/i);
    expect(screen.getAllByRole('progressbar', { name: /5h remaining/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('progressbar', { name: /weekly remaining/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId(/^account-card-/).map((node) => node.getAttribute('data-testid'))).toEqual([
      'account-card-snap-1',
      'account-card-snap-2',
      'account-card-snap-3',
      'account-card-snap-4'
    ]);

    fireEvent.click(within(screen.getByTestId('account-card-snap-1')).getByRole('button', { name: /^delete$/i }));
    expect(within(screen.getByTestId('account-card-snap-1')).getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId('account-card-snap-1')).getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(window.codexSwitcher.deleteSnapshot).toHaveBeenCalledWith('snap-1');
    });

    fireEvent.click(screen.getByRole('button', { name: /refresh all quotas/i }));

    await waitFor(() => {
      expect(window.codexSwitcher.refreshSnapshotUsage).toHaveBeenNthCalledWith(1, 'snap-1');
      expect(window.codexSwitcher.refreshSnapshotUsage).toHaveBeenNthCalledWith(2, 'snap-2');
      expect(window.codexSwitcher.refreshSnapshotUsage).toHaveBeenNthCalledWith(3, 'snap-3');
      expect(window.codexSwitcher.refreshSnapshotUsage).toHaveBeenNthCalledWith(4, 'snap-4');
    });
    expect(screen.getByText(/1 quota refresh failed/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/snapshot label/i), { target: { value: 'New Snapshot' } });
    fireEvent.click(screen.getByRole('button', { name: /capture current/i }));

    await waitFor(() => {
      expect(window.codexSwitcher.captureCurrentAccount).toHaveBeenCalledWith('New Snapshot');
    });

    fireEvent.click(screen.getByRole('tab', { name: /current account status/i }));

    expect(screen.queryByRole('button', { name: /capture current/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /current live codex status/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /current 5h remaining/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /current weekly remaining/i })).toBeInTheDocument();
    expect(screen.getByText(/quota updated/i)).toBeInTheDocument();
    expect(screen.getByText(/5h reset/i)).toBeInTheDocument();
    expect(screen.getByText(/weekly reset/i)).toBeInTheDocument();
    expect(screen.queryByText(/token expiry/i)).not.toBeInTheDocument();
  });

  it('shows a helpful error when the desktop bridge is unavailable', async () => {
    Reflect.deleteProperty(window, 'codexSwitcher');

    render(<App />);

    expect(await screen.findByText(/desktop bridge is unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capture current/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /rollback last switch/i })).toBeDisabled();
  });

  it('stays usable when local codex auth files are missing', async () => {
    window.codexSwitcher = {
      listSnapshots: vi.fn(async () => []),
      captureCurrentAccount: vi.fn(async (label: string) => ({ id: label })),
      switchToSnapshot: vi.fn(async (id: string) => ({ id })),
      restoreLastBackup: vi.fn(async () => ({ email: 'restored@example.com' })),
      readDesktopInfo: vi.fn(async () => ({
        productName: 'Codex Desktop Manager',
        version: '0.1.0',
        platform: {
          id: 'win32',
          label: 'Windows',
          switchingSupported: true,
          reason: null
        }
      })),
      refreshSnapshotUsage: vi.fn(async (snapshotId: string) => ({ id: snapshotId })),
      deleteSnapshot: vi.fn(async (snapshotId: string) => ({ id: snapshotId })),
      readLocalUsage: vi.fn(async () => {
        throw new Error("ENOENT: no such file or directory, open 'auth.json'");
      })
    };

    render(<App />);

    expect(await screen.findByText(/enoent: no such file or directory/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /account pool/i })).toBeInTheDocument();
    expect(screen.getByTestId('desktop-meta-badges')).toBeInTheDocument();
    expect(screen.getByText(/^v0\.1\.0$/i)).toBeInTheDocument();
  });
});
