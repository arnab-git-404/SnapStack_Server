const { validationResult } = require("express-validator");

// const validateRequest = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty())
//     return res.status(422).json({ errors: errors.array() });
//   next();
// };

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = validateRequest;
