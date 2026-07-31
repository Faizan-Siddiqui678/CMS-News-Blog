// middleware/isLoggedIn.js
//
// Accepts EITHER an admin session OR a valid user JWT cookie.
// Attaches req.user = { id, username, role: "admin"|"user" } so every
// downstream controller and view knows who is logged in and their role.
// Redirects to /login if neither is present.

const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwt");

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      try { cookies[key] = decodeURIComponent(val); }
      catch { cookies[key] = val; }
    }
  });
  return cookies;
}

module.exports = function isLoggedIn(req, res, next) {
  // 1. Admin — identified by session
  if (req.session && req.session.adminId) {
    req.user = {
      id:       req.session.adminId.toString(),
      username: "Admin",
      role:     "admin",
    };
    return next();
  }

  // 2. User — identified by JWT cookie
  const cookies = parseCookies(req.headers.cookie);
  const token   = cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id:       decoded.id,
        username: decoded.username,
        role:     "user",
      };
      return next();
    } catch {
      res.clearCookie("token");
    }
  }

  // 3. Nobody is logged in — redirect to login
  res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
};