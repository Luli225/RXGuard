const BatchInventory = require('../models/BatchInventory');
const Drug = require('../models/Drug');
const { logAudit } = require('../services/auditService');

// Get all inventory batches with FEFO sorting option
async function getBatches(req, res, next) {
  try {
    const { drugCode, nearExpiryOnly, sortBy } = req.query;
    let query = {};
    if (drugCode) query.drugCode = drugCode;

    let sortOption = { expiryDate: 1 }; // Default FEFO (earliest expiry first)
    if (sortBy === 'stock') sortOption = { stockOnHand: -1 };

    let batches = await BatchInventory.find(query).sort(sortOption);

    if (nearExpiryOnly === 'true') {
      batches = batches.filter(b => b.isNearExpiry());
    }

    // Attach daysToExpiry
    const enriched = batches.map(b => ({
      ...b.toObject(),
      daysToExpiry: b.getDaysToExpiry(),
      isNearExpiry: b.isNearExpiry()
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    next(err);
  }
}

// Create new batch lot
async function createBatch(req, res, next) {
  try {
    const { batchNumber, drugCode, expiryDate, stockOnHand, shelfLocation, barcode, manufacturer } = req.body;

    const drug = await Drug.findOne({ drugCode });
    if (!drug) {
      return res.status(404).json({ success: false, error: `Drug with code ${drugCode} not found in formulary` });
    }

    const batch = new BatchInventory({
      batchNumber,
      drugId: drug._id,
      drugCode: drug.drugCode,
      drugName: drug.genericName,
      strength: drug.strength,
      dosageForm: drug.dosageForm,
      expiryDate: new Date(expiryDate),
      stockOnHand: Number(stockOnHand),
      shelfLocation,
      barcode: barcode || `BC-${batchNumber}`,
      manufacturer: manufacturer || 'Ethiopian Pharmaceuticals Mfg'
    });

    await batch.save();
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
}

// Supervisory override for batches approaching 30-day expiration (DEF-01 / FR08)
async function overrideNearExpiryBatch(req, res, next) {
  try {
    const { id } = req.params;
    const { supervisoryNotes } = req.body;

    const batch = await BatchInventory.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    batch.supervisoryReleaseAuthorized = true;
    await batch.save();

    await logAudit({
      actionType: 'MEDICATION_RESERVATION',
      user: req.user,
      details: {
        batchNumber: batch.batchNumber,
        action: 'SUPERVISORY_NEAR_EXPIRY_OVERRIDE',
        notes: supervisoryNotes || 'Authorized for immediate short-term therapy cycle per DEF-01'
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Batch ${batch.batchNumber} authorized for emergency dispensing despite near-expiry threshold (DEF-01).`,
      data: batch
    });
  } catch (err) {
    next(err);
  }
}

// Drug Formulary Catalog Search (PQR4: < 500ms)
async function getDrugCatalog(req, res, next) {
  const startTime = Date.now();
  try {
    const { search, schedule, classCategory } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { genericName: new RegExp(search, 'i') },
        { brandName: new RegExp(search, 'i') },
        { drugCode: new RegExp(search, 'i') },
        { pharmacologicalClass: new RegExp(search, 'i') }
      ];
    }
    if (schedule) query.schedule = schedule;
    if (classCategory) query.pharmacologicalClass = new RegExp(classCategory, 'i');

    const drugs = await Drug.find(query).sort({ genericName: 1 });
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      count: drugs.length,
      latencyMs,
      benchmarkSatisfied: latencyMs < 500,
      data: drugs
    });
  } catch (err) {
    next(err);
  }
}

// Get single drug monograph
async function getDrugByCode(req, res, next) {
  try {
    const drug = await Drug.findOne({ drugCode: req.params.code });
    if (!drug) {
      return res.status(404).json({ success: false, error: 'Drug not found' });
    }
    res.json({ success: true, data: drug });
  } catch (err) {
    next(err);
  }
}

// Create new Drug/Medicine in Formulary with initial active batch (Admin)
async function createDrug(req, res, next) {
  try {
    const {
      drugCode,
      genericName,
      brandName,
      dosageForm,
      strength,
      strengthValue,
      strengthUnit = 'mg',
      pharmacologicalClass,
      schedule = 'Prescription Only',
      unitPrice,
      maxDailyDose,
      initialBatchNumber,
      initialStock = 250,
      shelfLocation
    } = req.body;

    if (!genericName || !strength || !dosageForm || !unitPrice) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: genericName, strength, dosageForm, and unitPrice are required.'
      });
    }

    // Auto-generate drugCode if not provided (e.g. EFDA-MED-013)
    let assignedCode = drugCode;
    if (!assignedCode) {
      const count = await Drug.countDocuments();
      const codeNum = String(count + 1).padStart(3, '0');
      assignedCode = `EFDA-MED-${codeNum}`;
    }

    // Check duplicate
    const existing = await Drug.findOne({ drugCode: assignedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Drug code ${assignedCode} already exists.`
      });
    }

    const parsedStrengthValue = Number(strengthValue) || parseFloat(strength) || 100;
    const drug = new Drug({
      drugCode: assignedCode,
      genericName: genericName.trim(),
      brandName: (brandName || genericName).trim(),
      dosageForm: dosageForm.trim(),
      strength: strength.trim(),
      strengthValue: parsedStrengthValue,
      strengthUnit: strengthUnit || 'mg',
      pharmacologicalClass: pharmacologicalClass || 'Therapeutic Agent',
      schedule: schedule || 'Prescription Only',
      standardDosageBounds: {
        minDailyDose: 0,
        maxDailyDose: Number(maxDailyDose) || (parsedStrengthValue * 4),
        unit: strengthUnit || 'mg'
      },
      unitPrice: Number(unitPrice) || 25
    });

    await drug.save();

    // Automatically create an initial active inventory batch so the drug can immediately be staged & dispensed
    const codeSuffix = (drug.genericName || 'MED').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const batchNumber = initialBatchNumber || `LOT-${codeSuffix}-2026-X1`;
    const expiryDate = new Date(Date.now() + 540 * 24 * 60 * 60 * 1000); // 18 months in future
    const barcode = `01003123456789011727091510${codeSuffix}01`;

    const initialBatch = new BatchInventory({
      batchNumber,
      drugId: drug._id,
      drugCode: drug.drugCode,
      drugName: drug.genericName,
      strength: drug.strength,
      dosageForm: drug.dosageForm,
      expiryDate,
      stockOnHand: Number(initialStock) || 250,
      shelfLocation: shelfLocation || `Shelf F-01 (${drug.dosageForm})`,
      barcode
    });
    await initialBatch.save();

    // Audit log
    await logAudit({
      actionType: 'FORMULARY_UPDATE',
      user: req.user,
      details: {
        drugCode: drug.drugCode,
        genericName: drug.genericName,
        strength: drug.strength,
        batchNumber: initialBatch.batchNumber
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: `Medication "${drug.genericName}" (${drug.strength}) successfully registered with initial batch ${initialBatch.batchNumber}.`,
      data: drug,
      batch: initialBatch
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBatches,
  createBatch,
  overrideNearExpiryBatch,
  getDrugCatalog,
  getDrugByCode,
  createDrug
};
