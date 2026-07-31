const slugify = require("slugify");
const Category = require("../models/Category");
const Post = require("../models/Post");

exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.render("admin/categories", {
    categories,
    error: req.query.error || null,
    success: req.query.success || null,
  });
};

exports.getEditCategoryForm = async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.redirect("/admin/categories?error=" + encodeURIComponent("Category not found"));
  }

  const categories = await Category.find().sort({ name: 1 });
  res.render("admin/edit-category", { category, categories, error: req.query.error || null });
};

exports.createCategory = async (req, res) => {
  const { name } = req.body;
  const slug = slugify(name, { lower: true });

  try {
    await Category.create({ name, slug });
    res.redirect("/admin/categories?success=" + encodeURIComponent("Category created"));
  } catch (err) {
    const message =
      err.code === 11000 ? "A category with that name already exists" : "Could not create category";
    res.redirect("/admin/categories?error=" + encodeURIComponent(message));
  }
};

exports.updateCategory = async (req, res) => {
  const { name } = req.body;
  const slug = slugify(name, { lower: true });

  try {
    await Category.findByIdAndUpdate(req.params.id, { name, slug }, { runValidators: true });
    res.redirect("/admin/categories?success=" + encodeURIComponent("Category updated"));
  } catch (err) {
    const message =
      err.code === 11000 ? "A category with that name already exists" : "Could not update category";
    res.redirect(`/admin/categories/edit/${req.params.id}?error=` + encodeURIComponent(message));
  }
};

exports.deleteCategory = async (req, res) => {
  const postCount = await Post.countDocuments({ category: req.params.id });

  if (postCount > 0) {
    const message = `Can't delete: ${postCount} post(s) still use this category. Move or delete them first.`;
    return res.redirect("/admin/categories?error=" + encodeURIComponent(message));
  }

  await Category.findByIdAndDelete(req.params.id);
  res.redirect("/admin/categories?success=" + encodeURIComponent("Category deleted"));
};