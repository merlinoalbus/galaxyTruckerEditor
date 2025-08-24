const express = require('express');
const router = express.Router();
const { exportLanguages } = require('../controllers/exportController');

// POST /api/export/languages
router.post('/languages', exportLanguages);

module.exports = router;