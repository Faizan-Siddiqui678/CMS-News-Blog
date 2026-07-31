const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  content: {
    type: String, // stores the Summernote-generated HTML
    required: true,
  },
  featuredImage: {
    type: String, // path to the uploaded featured/cover image, e.g. /uploads/xxx.jpg
    default: "",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  // Tracks which visitors (by anonymous cookie id) have already viewed/liked
  // this post, so each visitor can only count once and can undo their like.
  viewedBy: {
    type: [String],
    default: [],
  },
  likedBy: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Post", postSchema);