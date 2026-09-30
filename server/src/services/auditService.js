const AuditLog = require('../models/AuditLog');

async function logAudit({
  actionType,
  user,
  prescriptionId = '',
  patientId = '',
  details = {},
  ipAddress = '127.0.0.1'
}) {
  try {
    const logId = `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const logEntry = new AuditLog({
      logId,
      actionType,
      userId: user?._id || null,
      userName: user?.fullName || 'System/Service',
      userRole: user?.role || 'SYSTEM',
      prescriptionId,
      patientId,
      details,
      ipAddress,
      timestamp: new Date()
    });
    await logEntry.save();
    return logEntry;
  } catch (err) {
    console.error('[RxGuard Audit] Failed to record audit log:', err.message);
  }
}

module.exports = { logAudit };
