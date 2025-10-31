// const mongoose = require('mongoose');

// const chatSchema = new mongoose.Schema({
//   participants: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }],
//   messages: [{
//     id: String,
//     senderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true
//     },
//     senderName: String,
//     content: String,
//     encryptedContent: {
//       type: String,
//       required: true
//     },
//     senderPublicKey: { type: String, required: true },

//     timestamp: {
//       type: Date,
//       default: Date.now
//     },
//     status: {
//       type: String,
//       enum: ['sending', 'sent', 'delivered', 'read'],
//       default: 'sent'
//     },
//     isEncrypted: {
//       type: Boolean,
//       default: true
//     }
//   }],
//   lastMessage: {
//     content: String,
//     senderId: mongoose.Schema.Types.ObjectId,
//     timestamp: Date
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Index for faster queries
// chatSchema.index({ participants: 1 });
// chatSchema.index({ 'messages.timestamp': -1 });

// module.exports = mongoose.model('Chat', chatSchema);

//TESING
const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  recipientId: { type: String, required: true },
  encryptedContent: { type: String, required: true },
  senderPublicKey: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: "sent" },
  isEncrypted: { type: Boolean, default: true },
});

module.exports = mongoose.model("Chat", ChatSchema);
