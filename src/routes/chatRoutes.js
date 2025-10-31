// const express = require('express');
// const router = express.Router();
// const {
//   registerEncryptionKey,
//   getPartnerPublicKey,
//   sendMessage,
//   getMessages,
//   updateMessageStatus,
//   deleteMessage,
//   clearChatHistory
// } = require('../controllers/chatController');

// const { protect, admin } = require('../middleware/authMiddleware');

// // All routes require authentication
// router.use(protect);

// // Encryption key routes
// router.post('/keys/register', registerEncryptionKey);
// router.get('/keys/partner', getPartnerPublicKey);

// // Message routes
// router.post('/messages', sendMessage);
// router.get('/messages', getMessages);
// router.patch('/messages/status', updateMessageStatus);
// router.delete('/messages/:messageId', deleteMessage);

// // Chat management
// router.delete('/history', clearChatHistory);

// module.exports = router;

