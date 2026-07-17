const express = require('express');
const { protect } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

router.use(protect);

router.post('/', uploadController.uploadFile);

module.exports = router;
