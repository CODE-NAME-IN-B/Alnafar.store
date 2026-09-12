import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimit } from '../middleware/rateLimit.js';

function mockReq(path = '/test', ip = '127.0.0.1') {
  return { path, ip, headers: {} };
}
function mockRes() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  return res;
}

describe('createRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const limiter = createRateLimit(60000, 3);
    const req = mockReq('/a', '10.0.0.1');
    const res = mockRes();
    const next = vi.fn();

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('blocks requests over the limit', () => {
    const limiter = createRateLimit(60000, 2);
    const req = mockReq('/b', '10.0.0.2');
    const res = mockRes();
    const next = vi.fn();

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('resets after window expires', () => {
    const limiter = createRateLimit(1000, 1);
    const req = mockReq('/c', '10.0.0.3');
    const res = mockRes();
    const next = vi.fn();

    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1100);

    const res2 = mockRes();
    limiter(req, res2, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('tracks per IP separately', () => {
    const limiter = createRateLimit(60000, 1);
    const res = mockRes();
    const next = vi.fn();

    limiter(mockReq('/d', '10.0.0.4'), res, next);
    limiter(mockReq('/d', '10.0.0.5'), res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
