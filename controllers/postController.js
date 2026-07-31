// controllers/postController.js
const fs       = require("fs");
const path     = require("path");
const slugify  = require("slugify");
const Post     = require("../models/Post");
const Category = require("../models/Category");
const Comment  = require("../models/Comment");

const UPLOAD_DIR         = path.join(__dirname, "..", "public", "uploads");
const RECENT_POSTS_LIMIT = 5;

function removeUploadedImage(imagePath) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOAD_DIR, path.basename(imagePath));
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT")
      console.error("Failed to remove old upload:", err.message);
  });
}

function getRecentPosts(excludeId) {
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};
  return Post.find(filter)
    .select("title slug featuredImage category createdAt")
    .populate("category")
    .sort({ createdAt: -1 })
    .limit(RECENT_POSTS_LIMIT);
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  const posts      = await Post.find().populate("category").sort({ createdAt: -1 });
  const categories = await Category.find().sort({ name: 1 });
  res.render("admin/dashboard", {
    posts,
    categories,
    error:   req.query.error   || null,
    success: req.query.success || null,
  });
};

exports.getNewPostForm = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.render("admin/post-form", { post: null, categories, error: req.query.error || null });
};

exports.createPost = async (req, res) => {
  const { title, content, category } = req.body;
  const slug          = slugify(title, { lower: true, strict: true });
  const featuredImage = req.file ? `/uploads/${req.file.filename}` : "";

  try {
    await Post.create({ title, slug, content, category, featuredImage });
    res.redirect("/admin/dashboard?success=" + encodeURIComponent("Post published"));
  } catch (err) {
    if (req.file) removeUploadedImage(featuredImage);
    const message =
      err.code === 11000 ? "A post with that title already exists" : "Could not create post";
    res.redirect("/admin/posts/new?error=" + encodeURIComponent(message));
  }
};

exports.getEditPostForm = async (req, res) => {
  const post = await Post.findById(req.params.id).populate("category");
  if (!post)
    return res.redirect("/admin/dashboard?error=" + encodeURIComponent("Post not found"));

  const categories = await Category.find().sort({ name: 1 });
  res.render("admin/post-form", { post, categories, error: req.query.error || null });
};

exports.updatePost = async (req, res) => {
  const { title, content, category } = req.body;
  const slug     = slugify(title, { lower: true, strict: true });
  const existing = await Post.findById(req.params.id);

  if (!existing) {
    if (req.file) removeUploadedImage(`/uploads/${req.file.filename}`);
    return res.redirect("/admin/dashboard?error=" + encodeURIComponent("Post not found"));
  }

  const updateData = { title, slug, content, category };
  if (req.file) updateData.featuredImage = `/uploads/${req.file.filename}`;

  try {
    await Post.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });
    if (req.file && existing.featuredImage) removeUploadedImage(existing.featuredImage);
    res.redirect("/admin/dashboard?success=" + encodeURIComponent("Post updated"));
  } catch (err) {
    if (req.file) removeUploadedImage(`/uploads/${req.file.filename}`);
    const message =
      err.code === 11000 ? "A post with that title already exists" : "Could not update post";
    res.redirect(`/admin/posts/edit/${req.params.id}?error=` + encodeURIComponent(message));
  }
};

exports.deletePost = async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  await Comment.deleteMany({ post: req.params.id });
  if (post && post.featuredImage) removeUploadedImage(post.featuredImage);
  res.redirect("/admin/dashboard?success=" + encodeURIComponent("Post deleted"));
};

exports.uploadEditorImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  res.json({ url: `/uploads/${req.file.filename}` });
};

// ── PUBLIC ────────────────────────────────────────────────────────────────────

exports.getHomePage = async (req, res) => {
  const posts       = await Post.find().populate("category").sort({ createdAt: -1 });
  const categories  = await Category.find().sort({ name: 1 });
  const recentPosts = await getRecentPosts();
  res.render("index", {
    posts, categories, recentPosts,
    category: null,
    user:  req.user,
    title: "News CMS - Home",
  });
};

exports.getCategoryPage = async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return res.status(404).send("Category not found");

  const posts       = await Post.find({ category: category._id }).populate("category").sort({ createdAt: -1 });
  const categories  = await Category.find().sort({ name: 1 });
  const recentPosts = await getRecentPosts();
  res.render("category", {
    posts, categories, recentPosts, category,
    user:  req.user,
    title: `${category.name} - News CMS`,
  });
};

exports.getSearchResults = async (req, res) => {
  const q = req.query.q || "";
  const posts = q
    ? await Post.find({ title: { $regex: q, $options: "i" } })
        .populate("category").sort({ createdAt: -1 })
    : [];
  const categories  = await Category.find().sort({ name: 1 });
  const recentPosts = await getRecentPosts();
  res.render("search", {
    posts, categories, recentPosts,
    category: null, query: q,
    user:  req.user,
    title: "Search Results - News CMS",
  });
};

exports.getSinglePost = async (req, res) => {
  const userId = req.user.id;

  let post = await Post.findOne({ slug: req.params.slug }).populate("category");
  if (!post) return res.status(404).send("Post not found");

  // Track unique views — skip if this user already viewed it
  if (!post.viewedBy.map(String).includes(String(userId))) {
    post = await Post.findByIdAndUpdate(
      post._id,
      { $inc: { views: 1 }, $addToSet: { viewedBy: userId } },
      { new: true }
    ).populate("category");
  }

  const hasLiked    = post.likedBy.map(String).includes(String(userId));
  const comments    = await Comment.find({ post: post._id })
    .populate("user", "username")
    .sort({ createdAt: -1 });
  const categories  = await Category.find().sort({ name: 1 });
  const recentPosts = await getRecentPosts(post._id);

  // Error message from query string (e.g. admin tried to comment)
  const errorMsg = req.query.error ? decodeURIComponent(req.query.error) : null;

  res.render("single", {
    post, comments, categories, recentPosts,
    category: null,
    hasLiked,
    user:  req.user,
    error: errorMsg,
    title: `${post.title} - News CMS`,
  });
};

exports.toggleLikePost = async (req, res) => {
  const userId = req.user.id;
  const post   = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const alreadyLiked = post.likedBy.map(String).includes(String(userId));
  const updated = await Post.findByIdAndUpdate(
    post._id,
    alreadyLiked
      ? { $inc: { likes: -1 }, $pull:     { likedBy: userId } }
      : { $inc: { likes:  1 }, $addToSet: { likedBy: userId } },
    { new: true }
  );
  res.json({ likes: updated.likes, liked: !alreadyLiked });
};