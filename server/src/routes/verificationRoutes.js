const express = require('express');
const router = express.Router();
const { runVerification, resolveOverride } = require('../controllers/verificationController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// UC02 Clinical Verification Run
router.post('/:prescriptionId/run', optionalAuth, runVerification);

// UC03 Clinical Alert Override (Restricted to Pharmacist & Admin per FR15)
router.post('/override/:alertId', authenticate, requireRole(['Pharmacist', 'Administrator']), resolveOverride);

module.exports = router;
