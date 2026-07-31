const express = require("express");
const router  = express.Router();

const postController     = require("../controllers/postController");
const commentController  = require("../controllers/commentController");
const authController     = require("../controllers/authController");
const userAuthController = require("../controllers/userAuthController");
const isLoggedIn         = require("../middleware/isLoggedIn");
const isLoggedInUser     = require("../middleware/isLoggedInUser");

// ── Auth routes (no login required) ──────────────────────────────────────────
router.get("/register",  userAuthController.getRegister);
router.post("/register", userAuthController.postRegister);

router.get("/login",  authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);

// ── All routes below require ANY logged-in user (admin OR registered user) ───
router.use(isLoggedIn);

// Public reading routes — admin and users both access these
router.get("/",               postController.getHomePage);
router.get("/category/:slug", postController.getCategoryPage);
router.get("/search",         postController.getSearchResults);
router.get("/post/:slug",     postController.getSinglePost);

// Like a post — admin and users both can toggle likes
router.post("/post/like/:id", postController.toggleLikePost);

// Post a comment — ONLY registered users (not admin)
router.post(
  "/post/:slug/comment",
  isLoggedInUser,
  commentController.addComment
);

module.exports = router;