const express = require('express');
const router = express.Router();
const { login, register, getMe, verifyPin } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.post('/verify-pin', authenticate, verifyPin);

module.exports = router;
