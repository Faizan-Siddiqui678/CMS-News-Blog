require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

const USERNAME = "admin";
const PASSWORD = "admin123";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Admin.findOne({ username: USERNAME });
  if (existing) {
    console.log("⚠️  Admin already exists, skipping.");
    return process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  await Admin.create({ username: USERNAME, password: hashedPassword });

  console.log("✅ Admin created!");
  console.log(`   username: ${USERNAME}`);
  console.log(`   password: ${PASSWORD}`);
  process.exit(0);
}

seed();