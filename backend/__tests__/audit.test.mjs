import { describe, it, expect, vi } from 'vitest';
import { initAudit, auditLog } from '../middleware/audit.js';

describe('auditLog', () => {
  it('does nothing when not initialized', async () => {
    initAudit(null);
    await auditLog({}, 'test_action', 'test', 1, null, { foo: 'bar' });
  });

  it('calls run function when initialized', async () => {
    const mockRun = vi.fn().mockResolvedValue({});
    initAudit(mockRun);

    const req = { user: { id: 1, username: 'admin' }, ip: '127.0.0.1', get: () => 'test-agent' };
    await auditLog(req, 'game_created', 'game', 42, null, { title: 'Test Game' });

    expect(mockRun).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRun.mock.calls[0];
    expect(sql).toContain('INSERT INTO audit_logs');
    expect(params).toContain('game_created');
    expect(params).toContain('game');
    expect(params).toContain('42');
    expect(params).toContain('admin');
  });

  it('handles missing user gracefully', async () => {
    const mockRun = vi.fn().mockResolvedValue({});
    initAudit(mockRun);

    await auditLog(null, 'system_event', null, null, null, null);
    expect(mockRun).toHaveBeenCalledTimes(1);
    const [, params] = mockRun.mock.calls[0];
    expect(params).toContain('system');
  });

  it('does not throw on run failure', async () => {
    const mockRun = vi.fn().mockRejectedValue(new Error('DB down'));
    initAudit(mockRun);

    await auditLog({ user: { id: 1, username: 'u' }, get: () => 'a' }, 'test', null, null, null, null);
  });
});
