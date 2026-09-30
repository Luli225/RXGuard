const express = require('express');
const router = express.Router();
const { syncEFDAFormulary } = require('../controllers/regulatoryController');
const { optionalAuth, authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// UC06: Synchronize with EFDA National Formulary
router.post('/sync', authenticate, requireRole(['Administrator', 'Pharmacist']), syncEFDAFormulary);

module.exports = router;
