const express = require('express');
const router = express.Router();
const {
  getBatches,
  createBatch,
  overrideNearExpiryBatch,
  getDrugCatalog,
  getDrugByCode,
  createDrug
} = require('../controllers/inventoryController');
const { optionalAuth, authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

router.get('/batches', optionalAuth, getBatches);
router.post('/batches', optionalAuth, createBatch);
router.post('/batches/:id/override-near-expiry', authenticate, requireRole(['Administrator', 'Pharmacist']), overrideNearExpiryBatch);

router.get('/drugs', optionalAuth, getDrugCatalog);
router.get('/drugs/:code', optionalAuth, getDrugByCode);
router.post('/drugs', optionalAuth, createDrug);

module.exports = router;
