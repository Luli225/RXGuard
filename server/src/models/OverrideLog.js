const mongoose = require('mongoose');
const { proxyModel } = require('./modelProxy');

const overrideLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true, index: true },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'SafetyAlert', required: true, index: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacistName: { type: String, required: true },
  pharmacistLicense: { type: String, default: '' },
  justificationCode: { 
    type: String, 
    required: true,
    enum: [
      'BENEFIT_OUTWEIGHS_RISK',
      'PRESCRIBER_CONFIRMED_ADJUSTED_MONITORING',
      'DOSE_TITRATED_BY_PRESCRIBER',
      'PATIENT_TOLERATED_PREVIOUSLY',
      'EMERGENCY_DISPENSE_SHORT_TERM'
    ]
  },
  clinicalNotes: { 
    type: String, 
    required: true,
    minlength: [15, 'Clinical rationale notes must be at least 15 characters long']
  },
  pinVerified: { type: Boolean, default: true },
  digitalSignature: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, immutable: true }
}, { 
  timestamps: false,
  versionKey: false 
});

const MongooseOverrideLog = mongoose.model('OverrideLog', overrideLogSchema);
module.exports = proxyModel('OverrideLog', MongooseOverrideLog);
