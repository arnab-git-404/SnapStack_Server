require("dotenv").config();
const http = require('http');
const app = require("./src/app");
const { Server } = require('socket.io');
const connectDB = require("./src/config/db");
const { connectRedis } = require("./src/config/redis");
const { setupSocket } = require('./src/services/socketService');


const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";


// Graceful shutdown handler
const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Connect to Redis
    await connectRedis();

    const server = http.createServer(app);

    // Initialize Socket.IO on the same server
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      transports: ['websocket', 'polling']
    });

    setupSocket(io);

    // Start Express server directly
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${NODE_ENV || "development"}`);
      console.log(`🗄️  MongoDB: Connected successfully`);
      console.log(`📦 GitHub: Image storage ready`);
      console.log(`⚡ Redis: Cache layer active`);
      console.log(`🔗 Socket.IO enabled`);

    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });

    // Graceful shutdown on signals
    process.on("SIGTERM", gracefulShutdown(server));
    process.on("SIGINT", gracefulShutdown(server));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      gracefulShutdown(server)("uncaughtException");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown(server)("unhandledRejection");
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();
