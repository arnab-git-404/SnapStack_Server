const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendPartnerInvite,
  getInviteDetails,
  acceptPartnerInvite,
  getPartnerStatus,
  cancelInvitation
} = require('../controllers/partnerController');

// Protected routes (require authentication)
router.post('/invite', protect, sendPartnerInvite);
router.get('/status',  protect, getPartnerStatus);
router.delete('/invitation', protect, cancelInvitation);

// Public routes (no authentication required)
router.get('/invite/:token', getInviteDetails);
router.post('/accept-invite/:token', acceptPartnerInvite);

module.exports = router;