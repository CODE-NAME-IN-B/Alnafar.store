// In-memory rate limiter (no npm dependency needed)
const rateLimitStore = new Map();

function createRateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    const attempts = rateLimitStore.get(key) || [];
    const recent = attempts.filter(t => now - t < windowMs);
    if (recent.length >= maxRequests) {
      return res.status(429).json({ message: 'Too many requests, please try again later' });
    }
    recent.push(now);
    rateLimitStore.set(key, recent);
    next();
  };
}

// Cleanup old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of rateLimitStore.entries()) {
    const recent = attempts.filter(t => now - t < 15 * 60 * 1000);
    if (recent.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, recent);
    }
  }
}, 15 * 60 * 1000);

const loginRateLimit = createRateLimit(15 * 60 * 1000, 10);
const apiWriteRateLimit = createRateLimit(60 * 1000, 30);
const publicOrderRateLimit = createRateLimit(60 * 1000, 5);
const uploadRateLimit = createRateLimit(60 * 1000, 10);
const aiRateLimit = createRateLimit(60 * 1000, 5);

module.exports = {
  createRateLimit,
  loginRateLimit,
  apiWriteRateLimit,
  publicOrderRateLimit,
  uploadRateLimit,
  aiRateLimit
};
