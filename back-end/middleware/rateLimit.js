// back-end/middleware/rateLimit.js
// A small in-memory rate limiter for public routes, so nobody can scan through order numbers.
// Per client IP: at most `max` unverified lookups per `windowMs`. Good enough for a single API instance.

const clientIp = (req) => {
  // Render sits behind Cloudflare, which passes the real client address here.
  const cf = req.headers['cf-connecting-ip'];
  if (cf) return String(cf);
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return fwd.length ? fwd[fwd.length - 1] : req.ip;
};

const rateLimit = ({ windowMs = 60 * 1000, max = 90 } = {}) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const ip = clientIp(req);
    let entry = hits.get(ip);
    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 };
      hits.set(ip, entry);
    }
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (now - value.start > windowMs) hits.delete(key);
    }

    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.start + windowMs - now) / 1000)));
      return res.status(429).json({ message: 'Too many requests. Please wait a minute and try again.' });
    }

    // Count only lookups that did not prove ownership, so a customer polling their own
    // order with a valid tracking link is never slowed down.
    res.on('finish', () => {
      if (!res.locals.trackingVerified) entry.count += 1;
    });
    next();
  };
};

module.exports = rateLimit;
