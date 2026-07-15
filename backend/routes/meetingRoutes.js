const express = require('express');
const { protect } = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(meetingController.getAllMeetings)
  .post(meetingController.createMeeting);

router
  .route('/:id')
  .put(meetingController.updateMeeting)
  .delete(meetingController.deleteMeeting);

module.exports = router;
