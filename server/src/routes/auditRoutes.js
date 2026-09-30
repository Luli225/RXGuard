const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getOverrideLogs,
  exportAuditReport,
  getControlledSubstancesLog
} = require('../controllers/auditController');
const { optionalAuth, authenticate } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getAuditLogs);
router.get('/overrides', optionalAuth, getOverrideLogs);
router.get('/export', optionalAuth, exportAuditReport);
router.get('/controlled-substances', optionalAuth, getControlledSubstancesLog);

module.exports = router;
