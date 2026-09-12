import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireAdmin, requireRole, signToken, JWT_SECRET_ACTIVE } from '../middleware/auth.js';

function mockReq(token) {
  return { headers: { authorization: token ? `Bearer ${token}` : '' }, user: null };
}
function mockRes() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  return res;
}

describe('authMiddleware', () => {
  it('rejects missing token', () => {
    const req = mockReq(null);
    const res = mockRes();
    authMiddleware(req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects invalid token', () => {
    const req = mockReq('garbage');
    const res = mockRes();
    authMiddleware(req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('accepts valid token', () => {
    const token = signToken({ id: 1, username: 'admin', role: 'admin' });
    const req = mockReq(token);
    const res = mockRes();
    const next = vi.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
  });
});

describe('requireAdmin', () => {
  it('rejects non-admin', () => {
    const req = { user: { role: 'employee' } };
    const res = mockRes();
    requireAdmin(req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows admin', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  it('rejects wrong role', () => {
    const req = { user: { role: 'viewer' } };
    const res = mockRes();
    requireRole('admin', 'employee')(req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows matching role', () => {
    const req = { user: { role: 'employee' } };
    const res = mockRes();
    const next = vi.fn();
    requireRole('admin', 'employee')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('signToken', () => {
  it('creates a valid JWT', () => {
    const token = signToken({ id: 1, username: 'test', role: 'admin' });
    const decoded = jwt.verify(token, JWT_SECRET_ACTIVE);
    expect(decoded.id).toBe(1);
    expect(decoded.username).toBe('test');
    expect(decoded.role).toBe('admin');
  });
});
