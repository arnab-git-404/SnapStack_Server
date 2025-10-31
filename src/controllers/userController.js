const User = require("../models/User");
const Photo = require("../models/Photo");
const dotenv = require("dotenv");
const {
  getCache,
  setCache,
  deleteCache,
  clearUserCache,
  flushCache,
  CACHE_TTL,
  CACHE_KEYS,
} = require("../utils/cache");

dotenv.config();

// Get current user profile
const getMe = async (req, res) => {
  try {
    const userId = req.user._id;

    const cacheKey = CACHE_KEYS.userProfile(userId);
    const cached = await getCache(cacheKey);

    if (cached) {
      console.log(`📦 Cache hit for user profile: ${userId}`);
      return res.json({
        success: true,
        user: cached,
      });
    }

    // Fetch from database
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.id = user._id.toString();

    // Cache the result - user-specific
    await setCache(cacheKey, user, CACHE_TTL.USER_PROFILE);
    console.log(`💾 Cached user profile: ${userId}`);

    res.json({
      success: true,
      source: "getMe",
      user: {
        id: user.id,
        name: user.name,
        partnerName: user.partnerName,
        partnerId: user.partnerId,
        email: user.email,
        isActivated: user.isActivated,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
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

const uploadPhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, category, year, location, description } = req.body;

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
      userId: userId,
    });

    // Clearing Old cache for the specific category
    // const cacheKey = CACHE_KEYS.photosByCategory(category);
    // await deleteCache(cacheKey);

    // Also clear all old categories if new Category is created
    // await deleteCache(CACHE_KEYS.allCategories());

    await clearUserCache(userId);
    console.log(`🗑️  Cleared cache for user ${userId} after photo upload`);

    console.log(
      `✅ Photo uploaded - Image: GitHub, Metadata: MongoDB, Cache invalidated for: ${category}`
    );

    res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
      photo: {
        title: newPhoto.title,
        imageUrl: newPhoto.imageUrl,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all photos for the authenticated user
const getAllUserPhotos = async (req, res) => {
  try {
    const userId = req.user._id;

    // Try cache first
    const cacheKey = CACHE_KEYS.allUserPhotos(userId);
    const cached = await getCache(cacheKey);

    if (cached) {
      console.log(`📦 Cache hit for all photos of user: ${userId}`);
      return res.json({
        success: true,
        photos: cached,
        count: cached.length,
        source: "cache",
      });
    }

    // Fetch from database - only user's photos
    const photos = await Photo.find({ userId: userId });
    // .populate("uploadedBy", "name email")
    // .sort({ createdAt: -1 });

    // Cache the result
    await setCache(cacheKey, photos, CACHE_TTL.USER_PHOTOS);
    console.log(`💾 Cached all photos for user: ${userId}`);

    res.json({
      success: true,
      photos,
      count: photos.length,
      source: "database",
    });
  } catch (error) {
    console.error("Get all user photos error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch photos",
    });
  }
};

// Clear user-specific cache
const clearCache = async (req, res) => {
  try {
    const userId = req.user._id;

    // Clear all caches for this user
    await clearUserCache(userId);

    res.json({
      success: true,
      message: `Cache cleared successfully for user ${userId}`,
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
    });
  }
};

// Get photos by category - with Redis caching
const getPhotosByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user._id;

    // ✅ Step 1: Try to get from Redis cache
    const cacheKey = CACHE_KEYS.photosByCategory(userId, category);
    const cachedPhotos = await getCache(cacheKey);

    // If found in cache, return it. Reduce database load.
    if (cachedPhotos) {
      console.log(`✅ Cache hit for user ${userId}, category: ${category}`);

      return res.status(200).json({
        success: true,
        category,
        photos: cachedPhotos,
        source: "cache",
      });
    } else {
      console.log(
        `❌ Cache MISS for category: ${category} - Fetching from MongoDB`
      );
    }

    // ✅ Step 2: Fetch metadata from MongoDB
    // Use lean() for better performance and select only needed fields
    const photos = await Photo.find({ category, userId: userId })
      .select("-_id title year location description imageUrl")
      // .sort({ createdAt: -1 })
      .lean();

    if (photos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid category",
      });
    }
    // ✅ Step 3: Store the result in Redis cache for future requests
    await setCache(cacheKey, photos, CACHE_TTL.PHOTOS_BY_CATEGORY);
    console.log(
      `✅ Cached photos for user ${userId}, category: ${category} in Redis`
    );

    res.status(200).json({
      success: true,
      category,
      photos,
      source: "database",
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

// Clear ALL cache (admin only)
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

module.exports = {
  getMe,
  uploadPhoto,
  getAllUserPhotos,
  getPhotosByCategory,
  clearAllRedisCache,
  clearCache,
};
