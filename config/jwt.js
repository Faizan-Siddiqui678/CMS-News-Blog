if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment. Copy .env.example to .env and fill it in.");
}
module.exports = process.env.JWT_SECRET;