import rateLimit from "express-rate-limit";

// Limit chat requests to 30 requests per minute per IP
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error:
      "Whoa bro, you're maxing out your sets! Too many requests. Take a 60-second rest interval and try again.",
  },
});
