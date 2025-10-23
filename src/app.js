const cors = require("cors");
require("express-async-errors");
const morgan = require("morgan");
const helmet = require("helmet");
const express = require("express");
const cookieParser = require('cookie-parser');
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Trust proxy - important for rate limiting behind reverse proxy (nginx, load balancer)
app.set("trust proxy", 1);

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // logs for development
} else {
  app.use(morgan("combined")); // More detailed logs for production
}

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true, // Allow cookies
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Rate limiting - more granular control
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "15", 10) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs (optional)
  skip: (req) => {
    const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(",") || [];
    return whitelist.includes(req.ip);
  },
});

// Apply rate limiter to all routes
// app.use(limiter); Re-Open in Production after testing

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
// app.use("/api/auth", authLimiter, authRoutes); // Re-Open in Production after testing

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get('/', (req, res) => {
    res.json({ success: true, message: 'Photo Gallery Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

module.exports = app;
