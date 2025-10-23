const { getRedis, isRedisAvailable, isUpstashRedis } = require('../config/redis');

const CACHE_TTL = {
  PHOTOS_BY_CATEGORY: 3600, // 1 hour - metadata doesn't change often
  ALL_USERS: 1800, // 30 minutes
  USER_PROFILE: 900, // 15 minutes
};

// Cache key generators
const CACHE_KEYS = {
  photosByCategory: (category) => `photos:category:${category}`,
  allCategories: () => 'photos:categories:all',
  allUsers: () => 'users:all',
  userProfile: (userId) => `user:profile:${userId}`,
};

// Get data from cache
const getCache = async (key) => {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const redis = getRedis();
    const data = await redis.get(key);

    if (!data) return null;

    // Parse JSON for ioredis (Upstash REST returns parsed objects)
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    console.error("Cache get error:", error.message);
    return null;
  }
};


// Set data in cache with TTL
// const setCache = async (key, data, ttl = CACHE_TTL.PHOTOS_BY_CATEGORY) => {
//   if (!isRedisAvailable()) {
//     return false;
//   }

//   try {
//     const redis = getRedis();
//     const serialized = JSON.stringify(data);
//     await redis.set(key, serialized, 'EX', ttl);
//     return true;
//   } catch (error) {
//     console.error('Cache set error:', error.message);
//     return false;
//   }
// };
const setCache = async (key, data, ttl = CACHE_TTL.PHOTOS_BY_CATEGORY) => {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = getRedis();
    const serialized = JSON.stringify(data);

    if (isUpstashRedis()) {
      await redis.set(key, serialized, { ex: ttl });
      console.log(`✅ Cache set: ${key} (TTL: ${ttl}s)`);
    }

    return true;
  } catch (error) {
    console.error(`Cache set error for key "${key}":`, error.message);
    return false;
  }
};


// Delete specific cache key
// const deleteCache = async (key) => {
//   if (!isRedisAvailable()) {
//     return false;
//   }

//   try {
//     const redis = getRedis();
//     await redis.del(key);
//     console.log(`🗑️  Cache deleted: ${key}`);
//     return true;
//   } catch (error) {
//     console.error('Cache delete error:', error.message);
//     return false;
//   }
// };
const deleteCache = async (key) => {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = getRedis();
    await redis.del(key);
    console.log(`🗑️  Cache deleted: ${key}`);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key "${key}":`, error.message);
    return false;
  }
};

// Delete multiple cache keys by pattern
// const deleteCachePattern = async (pattern) => {
//   if (!isRedisAvailable()) {
//     return false;
//   }

//   try {
//     const redis = getRedis();
    
//     // For Upstash REST API, we need to use scan
//     let cursor = '0';
//     let keys = [];
    
//     do {
//       const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
//       cursor = result[0];
//       keys = keys.concat(result[1]);
//     } while (cursor !== '0');

//     if (keys.length > 0) {
//       await redis.del(...keys);
//       console.log(`🗑️  Cleared ${keys.length} cache keys matching: ${pattern}`);
//     }

//     return true;
//   } catch (error) {
//     console.error('Cache pattern delete error:', error.message);
//     return false;
//   }
// };
const deleteCachePattern = async (pattern) => {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = getRedis();

    if (isUpstashRedis()) {
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🗑️  Cleared ${keys.length} cache keys matching: ${pattern}`
        );
      }
    }

    return true;
  } catch (error) {
    console.error(
      `Cache pattern delete error for "${pattern}":`,
      error.message
    );
    return false;
  }
};



// Get cache stats
// const getCacheStats = async () => {
//   if (!isRedisAvailable()) {
//     return { available: false, message: "Redis not configured" };
//   }

//   try {
//     const redis = getRedis();
//     const info = await redis.info('stats');
//     return {
//       available: true,
//       info: info,
//     };
//   } catch (error) {
//     console.error('Cache stats error:', error.message);
//     return { available: false, error: error.message };
//   }
// };
const getCacheStats = async () => {
  if (!isRedisAvailable()) {
    return { available: false, message: "Redis not configured" };
  }

  try {
    const redis = getRedis();

    const dbsize = await redis.dbsize();
    const ping = await redis.ping();

    if (isUpstashRedis()) {
      return {
        available: true,
        type: "upstash",
        totalKeys: dbsize,
        status: ping === "PONG" ? "healthy" : "unhealthy",
      };
    }
  } catch (error) {
    console.error("Cache stats error:", error.message);
    return { 
      available: false, 
      error: error.message 
    };
  }
};

// Clear all database Cache
const flushCache = async () => {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = getRedis();
    await redis.flushdb(); // Clear current database
    console.log('🗑️  All cache cleared');
    return true;
  } catch (error) {
    console.error('Cache flush error:', error.message);
    return false;
  }
}

module.exports = {
  CACHE_TTL,
  CACHE_KEYS,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  getCacheStats,
  flushCache
};