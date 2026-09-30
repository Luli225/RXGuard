const AuditLog = require('../models/AuditLog');
const OverrideLog = require('../models/OverrideLog');
const Prescription = require('../models/Prescription');
const { logAudit } = require('../services/auditService');

// Get system audit logs (filterable)
async function getAuditLogs(req, res, next) {
  try {
    const { actionType, startDate, endDate, userRole, limit = 100 } = req.query;
    let query = {};

    if (actionType) query.actionType = actionType;
    if (userRole) query.userRole = userRole;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
}

// Get Clinical Override Logs (US-PA-01)
async function getOverrideLogs(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const overrides = await OverrideLog.find(query)
      .populate('alertId')
      .populate('prescriptionId')
      .sort({ timestamp: -1 });

    res.json({ success: true, count: overrides.length, data: overrides });
  } catch (err) {
    next(err);
  }
}

// Export Audit Report (US-PA-01: CSV / Structured format)
async function exportAuditReport(req, res, next) {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const overrides = await OverrideLog.find(query)
      .populate('alertId')
      .sort({ timestamp: -1 });

    // Record export event in audit trail
    await logAudit({
      actionType: 'AUDIT_EXPORT_GENERATED',
      user: req.user,
      details: { format, count: overrides.length },
      ipAddress: req.ip
    });

    if (format === 'csv') {
      let csv = 'LogID,Timestamp,PharmacistName,PharmacistLicense,AlertID,DrugName,Severity,JustificationCode,ClinicalRationale,SignatureHash\n';
      overrides.forEach(ov => {
        const drug = ov.alertId?.drugName || 'Unknown';
        const sev = ov.alertId?.severityLevel || 'N/A';
        const cleanNotes = (ov.clinicalNotes || '').replace(/"/g, '""');
        csv += `"${ov.logId}","${new Date(ov.timestamp).toISOString()}","${ov.pharmacistName}","${ov.pharmacistLicense}","${ov.alertId?.alertId || ''}","${drug}","${sev}","${ov.justificationCode}","${cleanNotes}","${ov.digitalSignature}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="RxGuard_Override_Audit_Report.csv"');
      return res.send(csv);
    }

    res.json({
      success: true,
      reportMetadata: {
        facility: 'Tewedaj Community Pharmacy (Bethel Branch)',
        inspectionAuthority: 'Ethiopian Food and Drug Authority (EFDA)',
        generatedAt: new Date(),
        regulatoryStandard: 'ES 7084:2024 / Good Dispensing Practice',
        totalOverrideRecords: overrides.length
      },
      data: overrides
    });
  } catch (err) {
    next(err);
  }
}

// Daily Controlled Substance & Narcotics Log (FR14)
async function getControlledSubstancesLog(req, res, next) {
  try {
    const controlledPrescriptions = await Prescription.find({
      status: 'DISPENSED',
      'items.genericName': { $regex: /tramadol|codeine|morphine|diazepam/i }
    }).populate('patient').sort({ updatedAt: -1 });

    res.json({
      success: true,
      standard: 'EFDA Controlled Substances & Narcotics Register ES 7084:2024',
      count: controlledPrescriptions.length,
      data: controlledPrescriptions
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAuditLogs,
  getOverrideLogs,
  exportAuditReport,
  getControlledSubstancesLog
};
