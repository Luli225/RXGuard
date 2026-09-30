const mongoose = require('mongoose');
const { proxyModel } = require('./modelProxy');

const batchInventorySchema = new mongoose.Schema({
  batchNumber: { type: String, required: true, unique: true, index: true },
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug' },
  drugCode: { type: String, required: true, index: true },
  drugName: { type: String, required: true },
  strength: { type: String, required: true },
  dosageForm: { type: String, required: true },
  expiryDate: { type: Date, required: true, index: true },
  stockOnHand: { type: Number, required: true, min: 0 },
  reservedQuantity: { type: Number, default: 0, min: 0 },
  shelfLocation: { type: String, required: true },
  barcode: { type: String, required: true, unique: true, index: true },
  manufacturer: { type: String, default: 'Ethiopian Pharmaceuticals Mfg' },
  supervisoryReleaseAuthorized: { type: Boolean, default: false }
}, { timestamps: true });

const schemaMethods = {
  getDaysToExpiry() {
    const diffTime = new Date(this.expiryDate).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  isNearExpiry() {
    return this.getDaysToExpiry() <= 30;
  }
};

batchInventorySchema.methods.getDaysToExpiry = schemaMethods.getDaysToExpiry;
batchInventorySchema.methods.isNearExpiry = schemaMethods.isNearExpiry;

const MongooseBatch = mongoose.model('BatchInventory', batchInventorySchema);
module.exports = proxyModel('BatchInventory', MongooseBatch, schemaMethods);
