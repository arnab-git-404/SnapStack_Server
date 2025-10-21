const jwt = require("jsonwebtoken");


const generateToken = (payload, options = {}) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET not defined in environment variables");
  }

  // Validate payload
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be a valid object");
  }

  // Don't include sensitive data in payload
  const { password, ...safePayload } = payload;

  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    issuer: process.env.JWT_ISSUER || "your-app-name",
    audience: process.env.JWT_AUDIENCE || "your-app-users",
  };

  return jwt.sign(safePayload, secret, { ...defaultOptions, ...options });
};


const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET not defined");
  }

  // Only store minimal data in refresh token
  const minimalPayload = {
    userId: payload.userId || payload.id || payload._id,
  };

  return jwt.sign(minimalPayload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};


const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken
      ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      : process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET not defined");
    }

    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw error;
  }
};


const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
};
