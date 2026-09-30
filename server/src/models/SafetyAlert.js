const mongoose = require('mongoose');
const { proxyModel } = require('./modelProxy');

const safetyAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true, index: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true, index: true },
  drugCode: { type: String, required: true },
  drugName: { type: String, required: true },
  severityLevel: { 
    type: String, 
    enum: ['Low', 'Moderate', 'Critical'], 
    required: true 
  },
  interactionType: { 
    type: String, 
    enum: [
      'DRUG_DRUG_INTERACTION', 
      'ALLERGY_CONTRAINDICATION', 
      'DISEASE_CONTRAINDICATION', 
      'DOSAGE_LIMIT_EXCEEDED', 
      'PEDIATRIC_DOSAGE_ANOMALY'
    ], 
    required: true 
  },
  contraindicationDetail: { type: String, default: '' },
  evidenceSummary: { type: String, required: true },
  pharmacologicalMechanism: { type: String, default: '' },
  clinicalRecommendation: { type: String, default: '' },
  riskScore: { type: Number, min: 0, max: 1, required: true },
  resolved: { type: Boolean, default: false },
  overrideLog: { type: mongoose.Schema.Types.ObjectId, ref: 'OverrideLog' }
}, { timestamps: true });

const MongooseSafetyAlert = mongoose.model('SafetyAlert', safetyAlertSchema);
module.exports = proxyModel('SafetyAlert', MongooseSafetyAlert);
