const User = require("../models/User");
const Photo = require("../models/Photo");
const dotenv = require("dotenv");
const {
  getCache,
  setCache,
  deleteCache,
  flushCache,
  CACHE_TTL,
  CACHE_KEYS,
} = require("../utils/cache");

dotenv.config();

// Get current user profile
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

// Get all users (admin only)
// const getAllUsers = async (req, res) => {
//   const users = await User.find().select("-password");

//   res.json({
//     success: true,
//     count: users.length,
//     users,
//   });
// };

// Get all users (admin only) - with caching
const getAllUsers = async (req, res) => {
  try {
    const cacheKey = CACHE_KEYS.allUsers();

    // Try cache first
    const cachedUsers = await getCache(cacheKey);
    if (cachedUsers) {
      return res.json({
        success: true,
        count: cachedUsers.length,
        users: cachedUsers,
        cached: true,
      });
    }

    // Fetch from MongoDB
    const users = await User.find().select("-password").lean();

    // Cache for 30 minutes
    await setCache(cacheKey, users, CACHE_TTL.ALL_USERS);

    res.json({
      success: true,
      count: users.length,
      users,
      cached: false,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
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

    // Clearing Old cache for the specific category
    const cacheKey = CACHE_KEYS.photosByCategory(category);
    await deleteCache(cacheKey);

    // Also clear all old categories if new Category is created
    await deleteCache(CACHE_KEYS.allCategories());

    console.log(
      `✅ Photo uploaded - Image: GitHub, Metadata: MongoDB, Cache invalidated for: ${category}`
    );

    res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
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

// Get photos by category - with Redis caching
const getPhotosByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const cacheKey = CACHE_KEYS.photosByCategory(category);

    // ✅ Step 1: Try to get from Redis cache
    const cachedPhotos = await getCache(cacheKey);

    // If found in cache, return it. Reduce database load.
    if (cachedPhotos) {
      console.log(`✅ Cache HIT for category: ${category}`);

      return res.status(200).json({
        success: true,
        category,
        photos: cachedPhotos,
        source: "cache",
      });
    }else {
      console.log(`❌ Cache MISS for category: ${category} - Fetching from MongoDB`);
    }
      
     // ✅ Step 2: Fetch metadata from MongoDB
    // Use lean() for better performance and select only needed fields
    const photos = await Photo.find({ category })
      .select("-_id title year location description imageUrl")
      .lean();

    if (photos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid category",
      });
    }
    // ✅ Step 3: Store the result in Redis cache for future requests
    await setCache(cacheKey, photos, CACHE_TTL.PHOTOS_BY_CATEGORY);
    console.log(`✅ Cached photos for category: ${category} in Redis`);

    res.status(200).json({
      success: true,
      category,
      photos,
      source: 'database',
    });
  } catch (error) {
    console.error("Error fetching photos by category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch photos",
      error: error.message,
    });
  }
};

const clearAllRedisCache = async (req, res) => {
  try {
    await flushCache();
    
    res.status(200).json({
      success: true,
      message: "Redis cache cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing Redis cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear Redis cache",
      error: error.message,
    });
  }
};

module.exports = { getMe, getAllUsers, uploadPhoto, getPhotosByCategory, clearAllRedisCache };
