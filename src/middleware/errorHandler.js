// Generic express error handler
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let status = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    status = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Token expired";
  }

  const response = {
    success: false,
    message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
    response.error = err;
  }

  return res.status(status).json(response);
};

module.exports = errorHandler;
