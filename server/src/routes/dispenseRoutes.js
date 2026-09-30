const express = require('express');
const router = express.Router();
const {
  checkStockAndReserve,
  scanBarcode,
  finalizeDispensing
} = require('../controllers/dispenseController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/:prescriptionId/stage-fefo', optionalAuth, checkStockAndReserve);
router.post('/:prescriptionId/items/:itemId/scan-barcode', optionalAuth, scanBarcode);
router.post('/:prescriptionId/finalize', optionalAuth, finalizeDispensing);

module.exports = router;
