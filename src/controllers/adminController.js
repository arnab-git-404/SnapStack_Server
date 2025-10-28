const os = require("os");
const User = require("../models/User"); // Adjust path based on your project structure
const {
  getCache,
  setCache,
  deleteCache,
  clearUserCache,
  flushCache,
  CACHE_TTL,
  CACHE_KEYS,
} = require("../utils/cache");

// Get all users (admin only) - with caching
const getAllUsers = async (req, res) => {
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.allUsers();
    const cachedUsers = await getCache(cacheKey);

    if (cachedUsers) {
      console.log("📦 Cache hit for all users");
      return res.json({
        success: true,
        users: cachedUsers,
        source: "cache",
      });
    }

    // Fetch from MongoDB
    const users = await User.find().select("-password").lean();

    // Cache for 30 minutes
    await setCache(cacheKey, users, CACHE_TTL.ALL_USERS);
    console.log("💾 Cached all users");

    res.json({
      success: true,
      users,
      source: "database",
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to fetch users",
      error: error.message,
    });
  }
};

// Server stats endpoint
const getServerStats = async (req, res) => {
  try {
    // Server uptime in seconds
    const uptime = process.uptime();

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // CPU usage
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = ((1 - totalIdle / totalTick) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      stats: {
        uptime: {
          seconds: uptime,
          formatted: formatUptime(uptime),
        },
        memory: {
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
          totalMemory: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          freeMemory: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usedMemoryPercentage: `${(
            ((totalMemory - freeMemory) / totalMemory) *
            100
          ).toFixed(2)}%`,
        },
        cpu: {
          usage: `${cpuUsage}%`,
          cores: cpus.length,
          model: cpus[0].model,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching server stats",
      error: error.message,
    });
  }
};

// Toggle user activation status
const toggleUserActivation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActivated } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActivated =
      isActivated !== undefined ? isActivated : !user.isActivated;
    await user.save();

    // Clear cache after updating user
    const cacheKey = CACHE_KEYS.allUsers();
    await deleteCache(cacheKey);
    console.log("🗑️ Cleared all users cache after activation toggle");

    res.status(200).json({
      success: true,
      message: `User ${
        user.isActivated ? "activated" : "deactivated"
      } successfully`,
      data: {
        userId: user._id,
        email: user.email,
        isActivated: user.isActivated,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user activation status",
      error: error.message,
    });
  }
};

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}


module.exports = {
  getAllUsers,
  getServerStats,
  toggleUserActivation
};
