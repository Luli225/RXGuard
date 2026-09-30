const mongoose = require('mongoose');
const { proxyModel } = require('./modelProxy');

const auditLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true, index: true },
  actionType: { 
    type: String, 
    required: true,
    enum: [
      'PRESCRIPTION_INTAKE',
      'CLINICAL_VERIFICATION_RUN',
      'CLINICAL_OVERRIDE_EXECUTED',
      'MEDICATION_RESERVATION',
      'BARCODE_VERIFIED',
      'DISPENSING_FINALIZED',
      'CONTROLLED_SUBSTANCE_DISPENSED',
      'REGULATORY_FORMULARY_SYNC',
      'AUDIT_EXPORT_GENERATED',
      'USER_LOGIN',
      'USER_LOCKOUT'
    ]
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  prescriptionId: { type: String, default: '' },
  patientId: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '127.0.0.1' },
  timestamp: { type: Date, default: Date.now, immutable: true }
}, {
  timestamps: false,
  versionKey: false
});

const MongooseAuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = proxyModel('AuditLog', MongooseAuditLog);
