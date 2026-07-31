// controllers/authController.js
//
// Single shared login for both admins and public users. There's only ever
// one admin account (seeded ahead of time via seed.js - admins never
// register), so we check that collection first; if it doesn't match we
// fall back to a registered User. Whichever one matches gets logged in the
// way that account type expects: an admin gets a session, a user gets a
// JWT cookie. See controllers/userAuthController.js for registration.
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const JWT_SECRET = require("../config/jwt");

const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function issueUserToken(res, user) {
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE_MS,
  });
}
exports.issueUserToken = issueUserToken; // reused by userAuthController after registration

exports.getLogin = (req, res) => {
  res.render("login", { error: null });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", { error: "Username and password are required" });
  }

  // Admin check first - seeded ahead of time, never registers.
  const admin = await Admin.findOne({ username });
  if (admin && (await bcrypt.compare(password, admin.password))) {
    req.session.adminId = admin._id;
    return res.redirect("/admin/dashboard");
  }

  // Otherwise, try a registered public user.
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    issueUserToken(res, user);
    return res.redirect("/");
  }

  res.render("login", { error: "Invalid username or password" });
};

exports.logout = (req, res) => {
  // Clear whichever kind of login is present - harmless if it wasn't set.
  res.clearCookie("token");

  if (req.session) {
    return req.session.destroy(() => res.redirect("/login"));
  }

  res.redirect("/login");
};