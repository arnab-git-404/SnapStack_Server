let redis = null;
let isUpstash = false;

const connectRedis = async () => {
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      // Upstash REST API (for serverless)
      const { Redis } = require("@upstash/redis");

      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      isUpstash = true;

      // Test connection
      const pingResult = await redis.ping();
      console.log("✅ Upstash Redis connected (REST API)");
      console.log(`📡 Ping response: ${pingResult}`);
    } else {
      console.warn("⚠️  Upstash Redis not configured. Caching disabled.");
      console.warn(
        "⚠️  Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env"
      );
    }

    return redis;
  } catch (error) {
    console.error("❌ Redis initialization error:", error.message);
    redis = null;
    return null;
  }
};

const getRedis = () => redis;

const isRedisAvailable = () => {
  return redis !== null;
};

const isUpstashRedis = () => isUpstash;

module.exports = { connectRedis, getRedis, isRedisAvailable, isUpstashRedis };
