import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.codexSwitcher = {
      listSnapshots: vi.fn(async () => [
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
          }
        }
      ]),
      captureCurrentAccount: vi.fn(async (label: string) => ({ id: label })),
      switchToSnapshot: vi.fn(async (id: string) => ({ id })),
      restoreLastBackup: vi.fn(async () => ({ email: 'restored@example.com' })),
      readLocalUsage: vi.fn(async () => ({
        statusLabel: 'Plan: pro · local activity 4',
        freshness: 'fresh',
        lastRefresh: '2026-03-10T09:19:31.445Z',
        tokenExpiry: '2026-03-10T12:19:31.445Z',
        recentSessionCount: 4,
        recentLogCount: 2
      }))
    };
  });

  it('renders account data and allows capture', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Saved accounts' })).toBeInTheDocument();
    expect(screen.getAllByText('Alice Work')).toHaveLength(2);
    expect(screen.getAllByText(/Plan: pro/i).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/snapshot label/i), { target: { value: 'New Snapshot' } });
    fireEvent.click(screen.getByRole('button', { name: /capture current/i }));

    await waitFor(() => {
      expect(window.codexSwitcher.captureCurrentAccount).toHaveBeenCalledWith('New Snapshot');
    });
  });
});

