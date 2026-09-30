const mongoose = require('mongoose');
const { proxyModel } = require('./modelProxy');

const drugSchema = new mongoose.Schema({
  drugCode: { type: String, required: true, unique: true, index: true },
  genericName: { type: String, required: true, index: true },
  brandName: { type: String, required: true },
  dosageForm: { type: String, required: true },
  strength: { type: String, required: true },
  strengthValue: { type: Number, required: true },
  strengthUnit: { type: String, required: true, default: 'mg' },
  pharmacologicalClass: { type: String, required: true },
  allergenClass: { type: String, default: '' },
  schedule: { 
    type: String, 
    enum: ['OTC', 'Prescription Only', 'Controlled / Narcotic', 'Restricted Antibiotic'], 
    default: 'Prescription Only' 
  },
  standardDosageBounds: {
    minDailyDose: { type: Number, default: 0 },
    maxDailyDose: { type: Number, required: true },
    unit: { type: String, default: 'mg' }
  },
  pediatricDosing: {
    minAgeMonths: { type: Number, default: 1 },
    mgPerKgPerDay: { type: Number, default: 0 },
    maxDailyDose: { type: Number, default: 0 }
  },
  contraindicatedConditions: [{
    condition: String,
    severity: { type: String, enum: ['Mild', 'Moderate', 'Critical'], default: 'Critical' },
    description: String
  }],
  drugInteractions: [{
    interactingDrugCode: String,
    interactingDrugName: String,
    severity: { type: String, enum: ['Mild', 'Moderate', 'Critical'], default: 'Moderate' },
    mechanism: String,
    clinicalEvidence: String,
    riskScore: { type: Number, min: 0, max: 1, default: 0.5 }
  }],
  foodInteractions: [{
    foodItem: String,
    warningAmharic: String,
    warningEnglish: String
  }],
  storagePrecautions: {
    amharic: { type: String, default: 'ከቀጥታ የፀሐይ ብርሃን እና ከእርጥበት ርቆ በቀዝቃዛ ቦታ ያስቀምጡ።' },
    english: { type: String, default: 'Store in a cool, dry place away from direct sunlight.' }
  },
  defaultInstructions: {
    amharic: { type: String, default: 'በሐኪም ትዕዛዝ መሠረት ይውሰዱ' },
    english: { type: String, default: 'Take as directed by prescriber' }
  },
  unitPrice: { type: Number, required: true, min: 0 }
}, { timestamps: true });

drugSchema.index({ genericName: 'text', brandName: 'text', pharmacologicalClass: 'text' });

const MongooseDrug = mongoose.model('Drug', drugSchema);
module.exports = proxyModel('Drug', MongooseDrug);
