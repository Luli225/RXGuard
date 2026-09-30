const Prescription = require('../models/Prescription');
const BatchInventory = require('../models/BatchInventory');
const { allocateBatchFEFO, validateScannedBarcode, decrementStock } = require('../services/inventoryService');
const { generateBilingualLabel } = require('../services/labelGeneratorService');
const { logAudit } = require('../services/auditService');

/**
 * Stage Medication & Allocate Batch via FEFO (UC04 / FR07 / FR08 / DEF-01)
 */
async function checkStockAndReserve(req, res, next) {
  try {
    const { prescriptionId } = req.params;
    const prescription = await Prescription.findById(prescriptionId).populate('patient');
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    if (!['CLINICALLY_APPROVED', 'APPROVED_WITH_OVERRIDE'].includes(prescription.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot stage inventory: Prescription status is "${prescription.status}". Order must be clinically approved first.`
      });
    }

    const allocations = [];
    let hasNearExpiryBlock = false;

    for (const item of prescription.items) {
      const alloc = await allocateBatchFEFO(item.drugCode, item.prescribedQuantity);
      if (!alloc.success) {
        if (alloc.blockedNearExpiry) {
          hasNearExpiryBlock = true;
        }
        allocations.push({
          itemId: item.itemId,
          drugCode: item.drugCode,
          genericName: item.genericName,
          status: 'BLOCKED',
          error: alloc.error,
          blockedNearExpiry: alloc.blockedNearExpiry,
          batchNumber: alloc.batch?.batchNumber,
          daysToExpiry: alloc.daysToExpiry
        });
      } else {
        item.allocatedBatchNumber = alloc.batch.batchNumber;
        allocations.push({
          itemId: item.itemId,
          drugCode: item.drugCode,
          genericName: item.genericName,
          status: 'ALLOCATED_FEFO',
          batchNumber: alloc.batch.batchNumber,
          shelfLocation: alloc.shelfLocation,
          daysToExpiry: alloc.daysToExpiry,
          expiryDate: alloc.batch.expiryDate
        });
      }
    }

    if (!hasNearExpiryBlock) {
      prescription.status = 'STAGED_FOR_DISPENSING';
    }
    await prescription.save();

    await logAudit({
      actionType: 'MEDICATION_RESERVATION',
      user: req.user,
      prescriptionId: prescription.prescriptionId,
      details: { allocations, hasNearExpiryBlock },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: hasNearExpiryBlock 
        ? 'Some batches are near expiry (<30 days) requiring supervisory authorization (FR08)' 
        : 'All items successfully allocated according to First-Expiry-First-Out (FEFO) rules',
      hasNearExpiryBlock,
      allocations,
      prescription
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Optical Barcode Scan Verification (UC05 / FR09 / US-PT-01 / Scenario 2 Exception)
 * Detects strength, form, or batch mismatch in real time (< 300ms)
 */
async function scanBarcode(req, res, next) {
  try {
    const { prescriptionId, itemId } = req.params;
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ success: false, error: 'Barcode data string is required' });
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    const item = prescription.items.find(it => it.itemId === itemId || it._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Prescription line item not found' });
    }

    // Perform barcode matching algorithm
    const matchResult = await validateScannedBarcode(barcode, item);

    if (!matchResult.valid) {
      // Scenario 2 Exception: Mismatch detected
      return res.status(422).json({
        success: false,
        isMatch: false,
        audioVisualAlert: true,
        errorCode: matchResult.errorCode,
        message: matchResult.message,
        prescribed: matchResult.prescribed,
        scanned: matchResult.scanned,
        latencyMs: matchResult.latencyMs
      });
    }

    // Match confirmed
    item.scannedBarcode = barcode;
    item.isBarcodeVerified = true;
    item.itemStatus = 'VERIFIED_SCANNED';
    if (!item.allocatedBatchNumber) {
      item.allocatedBatchNumber = matchResult.batchNumber;
    }
    await prescription.save();

    await logAudit({
      actionType: 'BARCODE_VERIFIED',
      user: req.user,
      prescriptionId: prescription.prescriptionId,
      details: {
        itemId: item.itemId,
        scannedBarcode: barcode,
        batchNumber: matchResult.batchNumber
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      isMatch: true,
      message: matchResult.message,
      batchNumber: matchResult.batchNumber,
      shelfLocation: matchResult.shelfLocation,
      latencyMs: matchResult.latencyMs,
      item
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Finalize Dispensing, Decrement Perpetual Stock & Print Bilingual Labels (UC05 / FR10 / FR12)
 */
async function finalizeDispensing(req, res, next) {
  try {
    const { prescriptionId } = req.params;
    const user = req.user;

    const prescription = await Prescription.findById(prescriptionId).populate('patient');
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    // Check if items are verified
    const unverifiedItem = prescription.items.find(it => !it.isBarcodeVerified);
    if (unverifiedItem) {
      return res.status(400).json({
        success: false,
        error: `Cannot finalize dispensing: Item "${unverifiedItem.genericName}" has not been scanned and barcode-verified.`
      });
    }

    // 1. Decrement Stock in BatchInventory in real-time (FR12)
    const decrementedBatches = [];
    for (const item of prescription.items) {
      const batchNum = item.allocatedBatchNumber;
      if (batchNum) {
        const updatedBatch = await decrementStock(batchNum, item.prescribedQuantity);
        decrementedBatches.push({
          batchNumber: batchNum,
          remainingStock: updatedBatch.stockOnHand
        });
      }
      item.dispensedQuantity = item.prescribedQuantity;
      item.itemStatus = 'DISPENSED';
    }

    // 2. Generate Bilingual Auxiliary Labels compliant with ES 7084:2024 (FR10 / UQR4)
    const labels = [];
    for (const item of prescription.items) {
      const batch = await BatchInventory.findOne({ batchNumber: item.allocatedBatchNumber });
      const label = generateBilingualLabel({
        prescription,
        item,
        batch,
        patient: prescription.patient,
        dispenser: user
      });
      labels.push(label);
    }

    // 3. Generate Official POS Receipt
    const receiptNumber = `RCP-ADD-${Date.now().toString().slice(-6)}`;
    prescription.status = 'DISPENSED';
    prescription.receiptNumber = receiptNumber;
    prescription.bilingualLabelGenerated = true;
    prescription.dispensedBy = {
      userId: user?._id,
      fullName: user?.fullName || 'Senior Pharmacist',
      role: user?.role || 'Pharmacist',
      timestamp: new Date()
    };
    await prescription.save();

    // 4. Log Dispensing & Controlled Substance audit (FR14)
    const hasControlledSubstance = prescription.items.some(
      it => it.genericName.toLowerCase().includes('tramadol') || 
            it.genericName.toLowerCase().includes('codeine') ||
            it.genericName.toLowerCase().includes('morphine')
    );

    await logAudit({
      actionType: hasControlledSubstance ? 'CONTROLLED_SUBSTANCE_DISPENSED' : 'DISPENSING_FINALIZED',
      user,
      prescriptionId: prescription.prescriptionId,
      patientId: prescription.patient.patientId,
      details: {
        receiptNumber,
        totalPrice: prescription.totalPrice,
        decrementedBatches,
        isControlledSubstance: hasControlledSubstance
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Dispensing finalized successfully. Stock decremented in real time.',
      receipt: {
        receiptNumber,
        date: new Date(),
        pharmacyName: 'Tewedaj Pharmacy - Bethel Branch',
        taxIdentificationNumber: 'TIN-0048192837',
        patientName: prescription.patient.fullName,
        patientId: prescription.patient.patientId,
        prescriber: prescription.prescriber.fullName,
        items: prescription.items.map(it => ({
          name: it.genericName,
          form: it.dosageForm,
          strength: it.strength,
          quantity: it.prescribedQuantity,
          batchNumber: it.allocatedBatchNumber
        })),
        totalPriceETB: prescription.totalPrice,
        dispensedBy: prescription.dispensedBy.fullName
      },
      bilingualLabels: labels,
      prescription
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkStockAndReserve,
  scanBarcode,
  finalizeDispensing
};
