const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { sendServerError } = require('../utils/errorResponse');

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(20);
    res.json({ success: true, data: notifications });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load notifications');
  }
});

// Mark every notification belonging to the authenticated user as read. This
// keeps the dashboard action server-backed rather than merely changing UI state.
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, data: { markedRead: result.modifiedCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unable to mark notifications as read' });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    // Only allow marking your own notifications as read
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { returnDocument: 'after' }
    );
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    return sendServerError(res, error, 'Unable to update this notification');
  }
});

module.exports = router;
