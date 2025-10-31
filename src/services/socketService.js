// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const EncryptionKey = require("../models/EncryptionKey");
// const cookie = require("cookie");

// const setupSocket = (io) => {
//   // Middleware to authenticate socket connections
//   io.use(async (socket, next) => {
//     try {
//       const cookies = cookie.parse(socket.handshake.headers.cookie || "");
//       const token = cookies.token;

//       if (!token) {
//         return next(new Error("Authentication error"));
//       }

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.id);

//       if (!user) {
//         return next(new Error("User not found"));
//       }

//       socket.userId = decoded.id;
//       socket.user = user;
//       next();
//     } catch (error) {
//       console.error("Socket auth error:", error);
//       next(new Error("Authentication failed"));
//     }
//   });

//   // Handle connections
//   io.on("connection", async (socket) => {
//     console.log(`✅ User connected: ${socket.userId}`);

//     // Join user to their own room
//     socket.join(`user:${socket.userId}`);

//     // Get partner public key and send it
//     try {
//       if (socket.user.partnerId) {
//         const partnerKey = await EncryptionKey.findOne({
//           userId: socket.user.partnerId,
//         });

//         if (partnerKey) {
//           socket.emit("partner_key", { publicKey: partnerKey.publicKey });
//           console.log(`📤 Sent partner key to user: ${socket.userId}`);
//         }
//       }
//     } catch (error) {
//       console.error("Error sending partner key:", error);
//     }

//     // Handle incoming messages
//     socket.on("send_message", (message) => {
//       try {
//         if (socket.user.partnerId) {
//           // Send to partner
//           io.to(`user:${socket.user.partnerId}`).emit("receive_message", {
//             ...message,
//             status: "delivered",
//           });

//           // Send delivery confirmation back to sender
//           socket.emit("message_delivered", { messageId: message.id });
//           console.log(
//             `💬 Message sent from ${socket.userId} to ${socket.user.partnerId}`
//           );
//         }
//       } catch (error) {
//         console.error("Error sending message:", error);
//         socket.emit("error", { message: "Failed to send message" });
//       }
//     });

//     // Handle typing indicator
//     socket.on("user_typing", () => {
//       try {
//         if (socket.user.partnerId) {
//           io.to(`user:${socket.user.partnerId}`).emit("partner_typing");
//         }
//       } catch (error) {
//         console.error("Error sending typing indicator:", error);
//       }
//     });

//     // Handle stop typing
//     socket.on("user_stop_typing", () => {
//       try {
//         if (socket.user.partnerId) {
//           io.to(`user:${socket.user.partnerId}`).emit("partner_stop_typing");
//         }
//       } catch (error) {
//         console.error("Error stopping typing indicator:", error);
//       }
//     });

//     // Handle message read receipt
//     socket.on("message_read", (data) => {
//       try {
//         if (socket.user.partnerId) {
//           io.to(`user:${socket.user.partnerId}`).emit("message_read", {
//             messageId: data.messageId,
//           });
//           console.log(`✓ Message read by ${socket.userId}`);
//         }
//       } catch (error) {
//         console.error("Error sending read receipt:", error);
//       }
//     });

//     // Handle disconnection
//     socket.on("disconnect", () => {
//       console.log(`❌ User disconnected: ${socket.userId}`);
//       socket.leave(`user:${socket.userId}`);
//     });

//     // Handle errors
//     socket.on("error", (error) => {
//       console.error(`Socket error for user ${socket.userId}:`, error);
//     });
//   });
// };

// module.exports = { setupSocket };

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const EncryptionKey = require("../models/EncryptionKey");
const cookie = require("cookie");
const Chat = require("../models/Chat");


const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      console.log("🔐 Socket authentication attempt...");

      // Parse cookies from handshake headers
      const cookieHeader = socket.handshake.headers.cookie;
      console.log("Cookie header:", cookieHeader);

      if (!cookieHeader) {
        console.error("❌ No cookie header found");
        return next(new Error("Authentication error: No cookies provided"));
      }

      const cookies = cookie.parse(cookieHeader);
      console.log("Parsed cookies:", Object.keys(cookies));

      const token = cookies.accessToken;

      if (!token) {
        console.error("❌ No accessToken in cookies");
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified for user:", decoded.id);

      const user = await User.findById(decoded.id).lean();

      if (!user) {
        console.error("❌ User not found:", decoded.id);
        return next(new Error("User not found"));
      }

      socket.userId = decoded.id;
      socket.user = user;
      console.log("✅ User authenticated:", user.name);
      next();
    } catch (error) {
      console.error("❌ Socket auth error:", error.message);

      if (error.name === "JsonWebTokenError") {
        return next(new Error("Invalid token"));
      }
      if (error.name === "TokenExpiredError") {
        return next(new Error("Token expired"));
      }

      next(new Error("Authentication failed"));
    }
  });

  // Handle connections
  io.on("connection", async (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.userId})`);


    // // 1️⃣ Identify and join personal room
    // socket.on("identify", (userId) => {
    //   // socket.userId = userId;
    //   socket.join(`user:${socket.userId}`);
    //   console.log(`🔑 User identified and joined room: user:${socket.userId}`);
    // });

    // // 2️ Request partner key
    // socket.on("request_partner_key", async () => {
    //   try {
    //     const partnerKey = await EncryptionKey.findOne({
    //       userId: socket.user.partnerId,
    //     });

    //     if (partnerKey) {
    //       socket.emit("partner_key", {
    //         publicKey: partnerKey?.publicKey || null,
    //       });
    //       console.log(`📤 Sent partner key to user: ${socket.user}`);
    //       console.log(`Partner Key is ${partnerKey?.publicKey || null}`);
    //     }
    //   } catch (error) {
    //     console.error("Error sending partner key:", error);
    //   }
    // });

    // // Handle incoming messages
    // socket.on("send_message", (message) => {

    //   try {
    //     const {
    //       id,
    //       senderId,
    //       senderName,
    //       recipientId,
    //       encryptedContent,
    //       senderPublicKey,
    //       timestamp,
    //     } = message;

    //     if (!recipientId || !encryptedContent || !senderPublicKey) return;

    //     // save to DB
    //      Chat.create({
    //       id,
    //       senderId,
    //       senderName,
    //       recipientId,
    //       encryptedContent,
    //       senderPublicKey,
    //       timestamp: timestamp || new Date(),
    //       status: 'sent',
    //       isEncrypted: true,
    //     }).catch((err) => console.error('DB save error:', err));


    //     // deliver to partner instantly
    //     io.to(`user:${recipientId}`).emit('receive_message', {
    //       id,
    //       senderId,
    //       senderName,
    //       encryptedContent,
    //       senderPublicKey,
    //       timestamp,
    //       status: 'delivered',
    //     });

    //     socket.emit('message_delivered', { messageId: id });
    //     console.log(`📩 ${senderId} → ${recipientId}`);
    //   } catch (error) {
    //     console.error("Invalid message format:", error);
    //     socket.emit('error', { message: 'send_message failed' });
        
    //   }
    // });


    
        // 1️⃣ Identify and join personal room
    socket.on("identify", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`🔑 User identified and joined room: user:${userId}`);
    });

    // 2️⃣ Register public key - THIS WAS MISSING!
    socket.on("register_key", async ({ userId, publicKey }) => {
      try {
        console.log(`🔐 Registering key for user: ${userId}`);
        console.log(`Public key length: ${publicKey?.length}`);
        console.log(`Public key (full): ${publicKey}`);

        // Store or update the key in database
        await EncryptionKey.findOneAndUpdate(
          { userId },
          { userId, publicKey },
          { upsert: true, new: true }
        );

        console.log(`✅ Key registered successfully for ${userId}`);
      } catch (error) {
        console.error("❌ Error registering key:", error);
        socket.emit("error", { message: "Failed to register encryption key" });
      }
    });

    // 3️⃣ Request partner key - FIXED!
    socket.on("request_partner_key", async ({ partnerId }) => {
      try {
        console.log(`📞 User ${socket.userId} requesting key for partner: ${partnerId}`);
        
        const partnerKey = await EncryptionKey.findOne({
          userId: partnerId,  // ✅ Use the partnerId from the request
        });

        if (partnerKey && partnerKey.publicKey) {
          console.log(`📤 Sending partner key (length: ${partnerKey.publicKey.length})`);
          console.log(`📤 Partner key (full): ${partnerKey.publicKey}`);
          
          socket.emit("partner_key", {
            publicKey: partnerKey.publicKey,
          });
        } else {
          console.warn(`⚠️ No key found for partner: ${partnerId}`);
          socket.emit("partner_key", {
            publicKey: null,
          });
        }
      } catch (error) {
        console.error("❌ Error sending partner key:", error);
        socket.emit("error", { message: "Failed to retrieve partner key" });
      }
    });

    // Handle incoming messages
    socket.on("send_message", (message) => {
      try {
        const {
          id,
          senderId,
          senderName,
          recipientId,
          encryptedContent,
          senderPublicKey,
          timestamp,
        } = message;

        console.log(`📨 Message from ${senderId}:`, {
          encryptedLength: encryptedContent?.length,
          senderPublicKeyLength: senderPublicKey?.length,
        });

        if (!recipientId || !encryptedContent || !senderPublicKey) {
          console.error("❌ Missing required message fields");
          return;
        }

        // save to DB
        Chat.create({
          id,
          senderId,
          senderName,
          recipientId,
          encryptedContent,
          senderPublicKey,
          timestamp: timestamp || new Date(),
          status: 'sent',
          isEncrypted: true,
        }).catch((err) => console.error('DB save error:', err));

        // deliver to partner instantly
        io.to(`user:${recipientId}`).emit('receive_message', {
          id,
          senderId,
          senderName,
          encryptedContent,
          senderPublicKey,
          timestamp,
          status: 'delivered',
        });

        socket.emit('message_delivered', { messageId: id });
        console.log(`✅ Message delivered: ${senderId} → ${recipientId}`);
      } catch (error) {
        console.error("❌ Invalid message format:", error);
        socket.emit('error', { message: 'send_message failed' });
      }
    });












    // Handle typing indicator
    socket.on("user_typing", () => {
      try {
        if (socket.user.partnerId) {
          io.to(`user:${socket.user.partnerId}`).emit("partner_typing");
        }
      } catch (error) {
        console.error("Error sending typing indicator:", error);
      }
    });

    // Handle stop typing
    socket.on("user_stop_typing", () => {
      try {
        if (socket.user.partnerId) {
          io.to(`user:${socket.user.partnerId}`).emit("partner_stop_typing");
        }
      } catch (error) {
        console.error("Error stopping typing indicator:", error);
      }
    });

    // Handle message read receipt
    socket.on("message_read", (data) => {
      try {
        if (socket.user.partnerId) {
          io.to(`user:${socket.user.partnerId}`).emit("message_read", {
            messageId: data.messageId,
          });
          console.log(`✓ Message read by ${socket.userId}`);
        }
      } catch (error) {
        console.error("Error sending read receipt:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(
        `❌ User disconnected: ${socket.user.name} (${socket.userId})`
      );
      // socket.leave(`user:${socket.userId}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Handle connection errors
  io.on("connect_error", (error) => {
    console.error("❌ Socket.IO connection error:", error);
  });
};

module.exports = { setupSocket };
