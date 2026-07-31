// controllers/commentController.js
const Comment = require("../models/Comment");
const Post    = require("../models/Post");

exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.redirect(`/post/${req.params.slug}?error=${encodeURIComponent("Comment cannot be empty")}`);
    }

    const post = await Post.findOne({ slug: req.params.slug });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // req.user.id is set by isLoggedIn → verified JWT → decoded.id (a User _id string)
    await Comment.create({
      post:    post._id,
      user:    req.user.id,
      comment: comment.trim(),
    });

    res.redirect(`/post/${req.params.slug}`);
  } catch (err) {
    console.error("Comment error:", err);
    res.redirect(`/post/${req.params.slug}?error=${encodeURIComponent("Could not save comment")}`);
  }
};