require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const compression = require("compression");
const path = require("path");

const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const isProd = process.env.NODE_ENV === "production";

if (!MONGO_URI || !SESSION_SECRET) {
  throw new Error("Missing MONGO_URI or SESSION_SECRET in environment. Copy .env.example to .env and fill it in.");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Gzips HTML/JSON/CSS/JS responses — cheap win, smaller payloads over the wire.
app.use(compression());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// maxAge: 0 in dev so edited CSS/JS/images show up on refresh without a
// hard-reload; bump way up in production once assets stop changing on
// every save. Uploaded images get unique filenames per upload (see
// middleware/upload.js), so long caching is always safe for them even
// in dev — a "new" image is always a new URL, never a stale one.
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: isProd ? "7d" : 0,
}));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 4 },
  })
);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use("/admin", adminRoutes);
app.use("/", publicRoutes);

app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});