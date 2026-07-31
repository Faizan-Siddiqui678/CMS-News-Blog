// controllers/userAuthController.js
//
// Registration for public users only. Admin has no registration - it's
// seeded ahead of time (see seed.js) and logs in through the same shared
// form as everyone else (controllers/authController.js).
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { issueUserToken } = require("./authController");

exports.getRegister = (req, res) => {
  res.render("register", { error: null });
};

exports.postRegister = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.render("register", { error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    // Log the user straight in after signup so they land on the site, not another form.
    issueUserToken(res, user);
    res.redirect("/");
  } catch (err) {
    const message =
      err.code === 11000 ? "That username or email is already taken" : "Could not register";
    res.render("register", { error: message });
  }
};