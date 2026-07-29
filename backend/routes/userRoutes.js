const express = require('express');
const { protect } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.route('/profile').get(userController.getProfile).put(userController.updateProfile);

router
  .route('/settings')
  .get(userController.getSettings)
  .put(userController.updateSettings);

module.exports = router;
