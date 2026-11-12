require("dotenv").config();
const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const User = require("./models/User");

async function seed() {
  await connectDatabase();
  if (!(await User.exists({ role: "admin" }))) {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password || password.length < 12) {
      throw new Error("Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters in server/.env.");
    }
    await User.create({ name: "System Administrator", email, password, role: "admin" });
    console.log("Created the initial administrator account from server/.env.");
  } else {
    console.log("An administrator already exists; no account was created.");
  }
  console.log("Seed complete.");
}

seed()
  .catch((error) => {
    console.error(`Seed failed: ${error.name || "Error"}. Check seed configuration and MongoDB availability.`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
