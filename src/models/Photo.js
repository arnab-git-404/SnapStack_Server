const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      // Example categories Change as needed
      // enum: ["arnab", "deblina", "together"],
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("Photo", PhotoSchema);
