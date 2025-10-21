const User = require("../models/User");
const Photo = require("../models/Photo");
const dotenv = require("dotenv");
dotenv.config();

// Get current user profile
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");

  res.json({
    success: true,
    count: users.length,
    users,
  });
};

const uploadPhoto = async (req, res) => {
  try {
    const { title, category, year, location, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Convert to base64 for GitHub
    const base64Content = file.buffer.toString("base64");

    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = `public/${category}/${fileName}`;

    // Upload to GitHub
    const githubResponse = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload ${category} photo`,
          content: base64Content,
          branch: process.env.GITHUB_BRANCH,
        }),
      }
    );

    const githubData = await githubResponse.json();

    if (!githubResponse.ok) {
      console.error("GitHub error:", githubData);
      return res
        .status(500)
        .json({ error: githubData.message || "GitHub upload failed" });
    }

    const imageUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/main/${filePath}`;

    // Save imageUrl to user profile or database as needed
    const newPhoto = await Photo.create({
      title,
      category,
      year,
      location,
      description,
      imageUrl,
    });

    res.status(201).json({
      success: true,
      user: {
        title: newPhoto.title,
        imageUrl: newPhoto.imageUrl,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
 
};

const getPhotosByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Use lean() for better performance and select only needed fields
    const photos = await Photo.find({ category })
      .select("title year location description imageUrl")
      .lean();

    if (photos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid category",
      });
    }

    res.status(200).json({
      success: true,
      category,
      photos,
    });
  } catch (error) {
    console.error("Error fetching photos by category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch photos",
      error: error.message
    });
  }
 
};

module.exports = { getMe, getAllUsers, uploadPhoto, getPhotosByCategory };
