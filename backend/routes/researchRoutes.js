const express = require('express');
const { protect } = require('../middleware/auth');
const { searchWorks } = require('../controllers/researchController');

const router = express.Router();
router.use(protect);
router.get('/search', searchWorks);

module.exports = router;
