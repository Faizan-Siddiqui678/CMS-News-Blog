const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const postController = require("../controllers/postController");
const categoryController = require("../controllers/categoryController");
const upload = require("../middleware/upload");

// Admin login/logout now live at the shared /login and /logout (see routes/publicRoutes.js)

router.get("/dashboard", requireAuth, postController.getDashboard);

router.get("/posts/new", requireAuth, postController.getNewPostForm);
router.post("/posts/new", requireAuth, upload.single("featuredImage"), postController.createPost);

router.get("/posts/edit/:id", requireAuth, postController.getEditPostForm);
router.post("/posts/edit/:id", requireAuth, upload.single("featuredImage"), postController.updatePost);

router.post("/posts/delete/:id", requireAuth, postController.deletePost);

// Used by the Summernote editor to upload images dropped/pasted into the article body
router.post("/posts/upload-image", requireAuth, upload.single("image"), postController.uploadEditorImage);

router.get("/categories", requireAuth, categoryController.getCategories);
router.post("/categories/new", requireAuth, categoryController.createCategory);
router.get("/categories/edit/:id", requireAuth, categoryController.getEditCategoryForm);
router.post("/categories/update/:id", requireAuth, categoryController.updateCategory);
router.post("/categories/delete/:id", requireAuth, categoryController.deleteCategory);

module.exports = router;