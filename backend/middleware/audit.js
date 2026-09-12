// Audit Logging Helper
// Requires `run` function from db-adapter to be passed in

let auditRun = null;

function initAudit(runFn) {
  auditRun = runFn;
}

async function auditLog(req, action, entityType, entityId, oldValue, newValue) {
  if (!auditRun) return;
  try {
    await auditRun(`INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      req?.user?.id || null,
      req?.user?.username || 'system',
      action,
      entityType || null,
      entityId != null ? String(entityId) : null,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      req?.ip || req?.connection?.remoteAddress || null,
      req?.get?.('user-agent') || null
    ]);
  } catch (e) {
    console.error('[Audit] Failed to log:', e.message);
  }
}

module.exports = { initAudit, auditLog };
