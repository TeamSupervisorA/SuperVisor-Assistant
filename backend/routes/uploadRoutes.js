const express = require('express');
const { protect } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

router.use(protect);

router.get('/file/:filename', uploadController.getFile);
router.post('/', uploadController.uploadFile);

module.exports = router;
