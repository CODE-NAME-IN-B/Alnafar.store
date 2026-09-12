const jwt = require('jsonwebtoken');

const JWT_SECRET_ACTIVE = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: JWT_SECRET environment variable is required in production');
    process.exit(1);
  }
  console.warn('⚠️ JWT_SECRET not set. Using development fallback.');
  return 'dev_only_not_for_production_' + require('crypto').randomBytes(16).toString('hex');
})();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET_ACTIVE);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role || 'admin' },
    JWT_SECRET_ACTIVE,
    { expiresIn: '7d' }
  );
}

module.exports = { authMiddleware, requireAdmin, requireRole, signToken, JWT_SECRET_ACTIVE };
