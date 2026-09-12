import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('db-adapter', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.VERCEL;
  });

  it('exports expected functions', async () => {
    const db = await import('../db-adapter.js');
    expect(typeof db.initDatabase).toBe('function');
    expect(typeof db.all).toBe('function');
    expect(typeof db.get).toBe('function');
    expect(typeof db.run).toBe('function');
    expect(typeof db.exec).toBe('function');
    expect(typeof db.getDbType).toBe('function');
  });

  it('throws on Vercel without Turso', async () => {
    process.env.VERCEL = '1';
    process.env.TURSO_DATABASE_URL = '';
    process.env.TURSO_AUTH_TOKEN = '';
    const db = await import('../db-adapter.js');
    await expect(db.initDatabase()).rejects.toThrow('TURSO_DATABASE_URL');
  });
});
