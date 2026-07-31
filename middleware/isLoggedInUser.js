// middleware/isLoggedInUser.js
//
// Must run AFTER isLoggedIn (which already attached req.user).
// Allows only role:"user" to POST comments.
// Admin gets a friendly redirect back to the post with an explanation.

module.exports = function isLoggedInUser(req, res, next) {
  if (!req.user) {
    return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  }

  if (req.user.role !== "user") {
    const backTo  = req.params.slug ? `/post/${req.params.slug}` : "/";
    const message = "Admins cannot post comments. Log in with a user account to comment.";
    return res.redirect(`${backTo}?error=${encodeURIComponent(message)}`);
  }

  next();
};