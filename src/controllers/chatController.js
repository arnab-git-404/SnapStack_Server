// // // const Chat = require('../models/Chat');
// // // const EncryptionKey = require('../models/EncryptionKey');
// // // const User = require('../models/User');
// // // const { v4: uuidv4 } = require('uuid');
// // // const jwt = require("jsonwebtoken");



// // // // Register/Update encryption key
// // // const registerEncryptionKey = async (req, res) => {
// // //   try {

// // //         const token = req.cookies.accessToken;

// // //         if (!token) {
// // //       return res.status(401).json({
// // //         success: false,
// // //         message: "Access denied. No token provided.",
// // //       });
// // //     }

// // //     // Verify token
// // //         const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

// // //     // const userId = req.user.id;

// // //     const userId = decoded.id;
// // //     const { publicKey } = req.body;

// // //     if (!publicKey) {
// // //       return res.status(400).json({
// // //         success: false,
// // //         message: 'Public key is required'
// // //       });
// // //     }

// // //     let encryptionKey = await EncryptionKey.findOne({ userId });

// // //     if (encryptionKey) {
// // //       encryptionKey.publicKey = publicKey;
// // //       encryptionKey.keyVersion += 1;
// // //       encryptionKey.updatedAt = new Date();
// // //     } else {
// // //       encryptionKey = new EncryptionKey({
// // //         userId,
// // //         publicKey
// // //       });
// // //     }

// // //     await encryptionKey.save();

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Encryption key registered successfully',
// // //       data: encryptionKey
// // //     });
// // //   } catch (error) {
// // //     console.error('Register encryption key error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Error registering encryption key',
// // //       error: error.message
// // //     });
// // //   }
// // // };

// // // // Get partner's public key
// // // const getPartnerPublicKey = async (req, res) => {
// // //   try {
// // //     const userId = req.user._id;
// // //     const user = await User.findById(userId);

// // //     if (!user || !user.partnerId) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Partner not found'
// // //       });
// // //     }

// // //     const partnerKey = await EncryptionKey.findOne({ userId: user.partnerId });

// // //     if (!partnerKey) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Partner encryption key not found'
// // //       });
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       data: {
// // //         publicKey: partnerKey.publicKey,
// // //         keyVersion: partnerKey.keyVersion
// // //       }
// // //     });
// // //   } catch (error) {
// // //     console.error('Get partner public key error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Error fetching partner public key',
// // //       error: error.message
// // //     });
// // //   }
// // // };

// // // // Send message
// // // const sendMessage = async (req, res) => {
// // //   try {
// // //     const userId = req.user.id;
// // //     const { id, content, encryptedContent } = req.body;

// // //     if (!encryptedContent) {
// // //       return res.status(400).json({
// // //         success: false,
// // //         message: 'Encrypted content is required'
// // //       });
// // //     }

// // //     const user = await User.findById(userId);

// // //     if (!user || !user.partnerId) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Partner not found'
// // //       });
// // //     }

// // //     // Find or create chat between users
// // //     let chat = await Chat.findOne({
// // //       participants: { $all: [userId, user.partnerId] }
// // //     });

// // //     if (!chat) {
// // //       chat = new Chat({
// // //         participants: [userId, user.partnerId],
// // //         messages: []
// // //       });
// // //     }

// // //     const messageId = id || uuidv4();
// // //     const newMessage = {
// // //       id: messageId,
// // //       senderId: userId,
// // //       senderName: user.name,
// // //       content,
// // //       encryptedContent,
// // //       timestamp: new Date(),
// // //       status: 'sent',
// // //       isEncrypted: true
// // //     };

// // //     chat.messages.push(newMessage);
// // //     chat.lastMessage = {
// // //       content: content.substring(0, 50),
// // //       senderId: userId,
// // //       timestamp: new Date()
// // //     };

// // //     await chat.save();

// // //     res.status(201).json({
// // //       success: true,
// // //       message: 'Message sent successfully',
// // //       data: newMessage
// // //     });
// // //   } catch (error) {
// // //     console.error('Send message error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Error sending message',
// // //       error: error.message
// // //     });
// // //   }
// // // };

// // // // Get all messages
// // // const getMessages = async (req, res) => {
// // //   try {
// // //     const userId = req.user.id;
// // //     const user = await User.findById(userId);

// // //     if (!user || !user.partnerId) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Partner not found'
// // //       });
// // //     }

// // //     const chat = await Chat.findOne({
// // //       participants: { $all: [userId, user.partnerId] }
// // //     }).sort({ 'messages.timestamp': -1 });

// // //     if (!chat) {
// // //       return res.status(200).json({
// // //         success: true,
// // //         data: []
// // //       });
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       data: chat.messages
// // //     });
// // //   } catch (error) {
// // //     console.error('Get messages error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Error fetching messages',
// // //       error: error.message
// // //     });
// // //   }
// // // };

// // // // Update message status
// // // const updateMessageStatus = async (req, res) => {
// // //   try {
// // //     const userId = req.user.id;
// // //     const { messageId, status } = req.body;

// // //     if (!['sent', 'delivered', 'read'].includes(status)) {
// // //       return res.status(400).json({
// // //         success: false,
// // //         message: 'Invalid status'
// // //       });
// // //     }

// // //     const user = await User.findById(userId);

// // //     const result = await Chat.updateOne(
// // //       {
// // //         participants: { $all: [userId, user.partnerId] },
// // //         'messages.id': messageId
// // //       },
// // //       {
// // //         $set: { 'messages.$.status': status }
// // //       }
// // //     );

// // //     if (result.modifiedCount === 0) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Message not found'
// // //       });
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Message status updated'
// // //     });
// // //   } catch (error) {
// // //     console.error('Update message status error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Error updating message status',
// // //       error: error.message
// // //     });
// // //   }
// // // };

// // // // Delete message
// // // const deleteMessage = async (req, res) => {
// // //   try {
// // //     const userId = req.user.id;
// // //     const { messageId } = req.params;

// // //     const user = await User.findById(userId);

// // //     const result = await Chat.updateOne(
// // //       {
// // //         participants: { $all: [userId, user.partnerId] },
// // //         'messages.id': messageId,
// // //         'messages.senderId': userId
// // //       },
// // //       {
// // //         $pull: { messages: { id: messageId } }
// // //       }
// // //     );

// // //     if (result.modifiedCount === 0) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Message not found or unauthorized'
// // //       });
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Message deleted successfully'
// // //     });
// // //   } catch (error) {
// // //     console.error('Delete message error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Error deleting message',
// // //       error: error.message
// // //     });
// // //   }
// // // };

// // // // Clear chat history
// // // const clearChatHistory = async (req, res) => {
// // //   try {
// // //     const userId = req.user.id;
// // //     const user = await User.findById(userId);

// // //     const result = await Chat.deleteOne({
// // //       participants: { $all: [userId, user.partnerId] }
// // //     });

// // //     if (result.deletedCount === 0) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Chat not found'
// // //       });
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       message: 'Chat history cleared successfully'
// // //     });
// // //   } catch (error) {
// // //     console.error('Clear chat history error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Error clearing chat history',
// // //       error: error.message
// // //     });
// // //   }
// // // };

// // // module.exports = {
// // //   registerEncryptionKey,
// // //   getPartnerPublicKey,
// // //   sendMessage,
// // //   getMessages,
// // //   updateMessageStatus,
// // //   deleteMessage,
// // //   clearChatHistory
// // // };



// // const Chat = require('../models/Chat');
// // const EncryptionKey = require('../models/EncryptionKey');
// // const User = require('../models/User');
// // const { v4: uuidv4 } = require('uuid');

// // // Register/Update encryption key
// // const registerEncryptionKey = async (req, res) => {
// //   try {
// //     const userId = req.user._id; // Changed from req.user.id
// //     const { publicKey } = req.body;

// //     if (!publicKey) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Public key is required'
// //       });
// //     }

// //     let encryptionKey = await EncryptionKey.findOne({ userId });

// //     if (encryptionKey) {
// //       encryptionKey.publicKey = publicKey;
// //       encryptionKey.keyVersion += 1;
// //       encryptionKey.updatedAt = new Date();
// //     } else {
// //       encryptionKey = new EncryptionKey({
// //         userId,
// //         publicKey
// //       });
// //     }

// //     await encryptionKey.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'Encryption key registered successfully',
// //       data: encryptionKey
// //     });
// //   } catch (error) {
// //     console.error('Register encryption key error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error registering encryption key',
// //       error: error.message
// //     });
// //   }
// // };

// // // Get partner's public key
// // // const getPartnerPublicKey = async (req, res) => {
// // //   try {
// // //     const userId = req.user._id; // Changed
// // //     const user = req.user; // Use req.user directly since it already has partnerId

// // //     console.log('User:', user); // Debug log

// // //     if (!user.partnerId) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Partner not found. Please link with your partner first.'
// // //       });
// // //     }

// // //     const partnerKey = await EncryptionKey.findOne({ userId: user.partnerId });

// // //     if (!partnerKey) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: 'Partner encryption key not found. Partner needs to register their key first.'
// // //       });
// // //     }

// // //     res.status(200).json({
// // //       success: true,
// // //       data: {
// // //         publicKey: partnerKey.publicKey,
// // //         keyVersion: partnerKey.keyVersion
// // //       }
// // //     });
// // //   } catch (error) {
// // //     console.error('Get partner public key error:', error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: 'Error fetching partner public key',
// // //       error: error.message
// // //     });
// // //   }
// // // };

// // const getPartnerPublicKey = async (req, res) => {
// //   try {
// //     // If req.user doesn't have partnerId, fetch it from DB
// //     let user = req.user;
    
// //     if (!user.partnerId) {
// //       console.log('⚠️ partnerId not in req.user, fetching from DB...');
// //       user = await User.findById(req.user._id);
// //       console.log('Fetched user from DB:', user);
// //     }

// //     console.log('User partnerId:', user.partnerId);
// //     console.log('Type:', typeof user.partnerId);

// //     if (!user.partnerId) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Partner not found. Please link with your partner first.'
// //       });
// //     }

// //     const partnerKey = await EncryptionKey.findOne({ 
// //       userId: user.partnerId 
// //     });

// //     if (!partnerKey) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Partner encryption key not found. Partner needs to register their key first.'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: {
// //         publicKey: partnerKey.publicKey,
// //         keyVersion: partnerKey.keyVersion
// //       }
// //     });
// //   } catch (error) {
// //     console.error('Get partner public key error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching partner public key',
// //       error: error.message
// //     });
// //   }
// // };



// // // Send message
// // const sendMessage = async (req, res) => {
// //   try {
// //     const userId = req.user._id; // Changed
// //     const { id, content, encryptedContent } = req.body;

// //     if (!encryptedContent) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Encrypted content is required'
// //       });
// //     }

// //     const user = req.user; // Use req.user directly

// //     if (!user.partnerId) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Partner not found'
// //       });
// //     }

// //     // Find or create chat between users
// //     let chat = await Chat.findOne({
// //       participants: { $all: [userId, user.partnerId] }
// //     });

// //     if (!chat) {
// //       chat = new Chat({
// //         participants: [userId, user.partnerId],
// //         messages: []
// //       });
// //     }

// //     const messageId = id || uuidv4();
// //     const newMessage = {
// //       id: messageId,
// //       senderId: userId,
// //       senderName: user.name,
// //       content,
// //       encryptedContent,
// //       timestamp: new Date(),
// //       status: 'sent',
// //       isEncrypted: true
// //     };

// //     chat.messages.push(newMessage);
// //     chat.lastMessage = {
// //       content: content ? content.substring(0, 50) : '',
// //       senderId: userId,
// //       timestamp: new Date()
// //     };

// //     await chat.save();

// //     res.status(201).json({
// //       success: true,
// //       message: 'Message sent successfully',
// //       data: newMessage
// //     });
// //   } catch (error) {
// //     console.error('Send message error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error sending message',
// //       error: error.message
// //     });
// //   }
// // };

// // // Get all messages
// // const getMessages = async (req, res) => {
// //   try {
// //     const userId = req.user._id; // Changed
// //     const user = req.user; // Use req.user directly
// //     console.log('User in getMessages:', user?.partnerId);

// //     if (!user.partnerId) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Partner not found'
// //       });
// //     }

// //     const chat = await Chat.findOne({
// //       participants: { $all: [userId, user.partnerId] }
// //     }).sort({ 'messages.timestamp': -1 });

// //     if (!chat) {
// //       return res.status(200).json({
// //         success: true,
// //         data: []
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: chat.messages
// //     });
// //   } catch (error) {
// //     console.error('Get messages error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching messages',
// //       error: error.message
// //     });
// //   }
// // };

// // // Update message status
// // const updateMessageStatus = async (req, res) => {
// //   try {
// //     const userId = req.user._id; // Changed
// //     const { messageId, status } = req.body;

// //     if (!['sent', 'delivered', 'read'].includes(status)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Invalid status'
// //       });
// //     }

// //     const user = req.user; // Use req.user directly

// //     const result = await Chat.updateOne(
// //       {
// //         participants: { $all: [userId, user.partnerId] },
// //         'messages.id': messageId
// //       },
// //       {
// //         $set: { 'messages.$.status': status }
// //       }
// //     );

// //     if (result.modifiedCount === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Message not found'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: 'Message status updated'
// //     });
// //   } catch (error) {
// //     console.error('Update message status error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error updating message status',
// //       error: error.message
// //     });
// //   }
// // };

// // // Delete message
// // const deleteMessage = async (req, res) => {
// //   try {
// //     const userId = req.user._id; // Changed
// //     const { messageId } = req.params;

// //     const user = req.user; // Use req.user directly

// //     const result = await Chat.updateOne(
// //       {
// //         participants: { $all: [userId, user.partnerId] },
// //         'messages.id': messageId,
// //         'messages.senderId': userId
// //       },
// //       {
// //         $pull: { messages: { id: messageId } }
// //       }
// //     );

// //     if (result.modifiedCount === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Message not found or unauthorized'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: 'Message deleted successfully'
// //     });
// //   } catch (error) {
// //     console.error('Delete message error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error deleting message',
// //       error: error.message
// //     });
// //   }
// // };

// // // Clear chat history
// // const clearChatHistory = async (req, res) => {
// //   try {
// //     const userId = req.user._id; // Changed
// //     const user = req.user; // Use req.user directly

// //     const result = await Chat.deleteOne({
// //       participants: { $all: [userId, user.partnerId] }
// //     });

// //     if (result.deletedCount === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Chat not found'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: 'Chat history cleared successfully'
// //     });
// //   } catch (error) {
// //     console.error('Clear chat history error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error clearing chat history',
// //       error: error.message
// //     });
// //   }
// // };

// // module.exports = {
// //   registerEncryptionKey,
// //   getPartnerPublicKey,
// //   sendMessage,
// //   getMessages,
// //   updateMessageStatus,
// //   deleteMessage,
// //   clearChatHistory
// // };



// const Chat = require('../models/Chat');
// const EncryptionKey = require('../models/EncryptionKey');
// const User = require('../models/User');
// const { v4: uuidv4 } = require('uuid');

// // Register/Update encryption key
// const registerEncryptionKey = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { publicKey } = req.body;

//     if (!publicKey) {
//       return res.status(400).json({
//         success: false,
//         message: 'Public key is required'
//       });
//     }

//     let encryptionKey = await EncryptionKey.findOne({ userId });

//     if (encryptionKey) {
//       encryptionKey.publicKey = publicKey;
//       encryptionKey.keyVersion += 1;
//       encryptionKey.updatedAt = new Date();
//     } else {
//       encryptionKey = new EncryptionKey({
//         userId,
//         publicKey
//       });
//     }

//     await encryptionKey.save();

//     res.status(200).json({
//       success: true,
//       message: 'Encryption key registered successfully',
//       data: encryptionKey
//     });
//   } catch (error) {
//     console.error('Register encryption key error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error registering encryption key',
//       error: error.message
//     });
//   }
// };

// // Get partner's public key
// const getPartnerPublicKey = async (req, res) => {
//   try {
//     const user = req.user; // Now this is a plain object with .lean()

//     console.log('User partnerId:', user.partnerId);
//     console.log('Type:', typeof user.partnerId);

//     if (!user.partnerId) {
//       return res.status(404).json({
//         success: false,
//         message: 'Partner not found. Please link with your partner first.'
//       });
//     }

//     const partnerKey = await EncryptionKey.findOne({ 
//       userId: user.partnerId 
//     });

//     if (!partnerKey) {
//       return res.status(404).json({
//         success: false,
//         message: 'Partner encryption key not found. Partner needs to register their key first.'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         publicKey: partnerKey.publicKey,
//         keyVersion: partnerKey.keyVersion
//       }
//     });
//   } catch (error) {
//     console.error('Get partner public key error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching partner public key',
//       error: error.message
//     });
//   }
// };

// // Send message
// const sendMessage = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { id, content, encryptedContent } = req.body;

//     if (!encryptedContent) {
//       return res.status(400).json({
//         success: false,
//         message: 'Encrypted content is required'
//       });
//     }

//     const user = req.user;

//     if (!user.partnerId) {
//       return res.status(404).json({
//         success: false,
//         message: 'Partner not found'
//       });
//     }

//     // Find or create chat between users
//     let chat = await Chat.findOne({
//       participants: { $all: [userId, user.partnerId] }
//     });

//     if (!chat) {
//       chat = new Chat({
//         participants: [userId, user.partnerId],
//         messages: []
//       });
//     }

//     const messageId = id || uuidv4();
//     const newMessage = {
//       id: messageId,
//       senderId: userId,
//       senderName: user.name,
//       content,
//       encryptedContent,
//       timestamp: new Date(),
//       status: 'sent',
//       isEncrypted: true
//     };

//     chat.messages.push(newMessage);
//     chat.lastMessage = {
//       content: content ? content.substring(0, 50) : '',
//       senderId: userId,
//       timestamp: new Date()
//     };

//     await chat.save();

//     res.status(201).json({
//       success: true,
//       message: 'Message sent successfully',
//       data: newMessage
//     });
//   } catch (error) {
//     console.error('Send message error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error sending message',
//       error: error.message
//     });
//   }
// };

// // Get all messages
// const getMessages = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const user = req.user;

//     console.log('User partnerId:', user.partnerId);

//     if (!user.partnerId) {
//       return res.status(404).json({
//         success: false,
//         message: 'Partner not found'
//       });
//     }

//     const chat = await Chat.findOne({
//       participants: { $all: [userId, user.partnerId] }
//     }).sort({ 'messages.timestamp': -1 });

//     if (!chat) {
//       return res.status(200).json({
//         success: true,
//         data: []
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: chat.messages
//     });
//   } catch (error) {
//     console.error('Get messages error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching messages',
//       error: error.message
//     });
//   }
// };

// // Update message status
// const updateMessageStatus = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { messageId, status } = req.body;

//     if (!['sent', 'delivered', 'read'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status'
//       });
//     }

//     const user = req.user;

//     const result = await Chat.updateOne(
//       {
//         participants: { $all: [userId, user.partnerId] },
//         'messages.id': messageId
//       },
//       {
//         $set: { 'messages.$.status': status }
//       }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Message not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Message status updated'
//     });
//   } catch (error) {
//     console.error('Update message status error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating message status',
//       error: error.message
//     });
//   }
// };

// // Delete message
// const deleteMessage = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { messageId } = req.params;
//     const user = req.user;

//     const result = await Chat.updateOne(
//       {
//         participants: { $all: [userId, user.partnerId] },
//         'messages.id': messageId,
//         'messages.senderId': userId
//       },
//       {
//         $pull: { messages: { id: messageId } }
//       }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Message not found or unauthorized'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Message deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete message error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting message',
//       error: error.message
//     });
//   }
// };

// // Clear chat history
// const clearChatHistory = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const user = req.user;

//     const result = await Chat.deleteOne({
//       participants: { $all: [userId, user.partnerId] }
//     });

//     if (result.deletedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Chat not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Chat history cleared successfully'
//     });
//   } catch (error) {
//     console.error('Clear chat history error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error clearing chat history',
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   registerEncryptionKey,
//   getPartnerPublicKey,
//   sendMessage,
//   getMessages,
//   updateMessageStatus,
//   deleteMessage,
//   clearChatHistory
// };


