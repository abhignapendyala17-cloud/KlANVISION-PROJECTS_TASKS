const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/healthcare";
  if (!mongoose.connection.listeners("connected").length) {
    mongoose.connection.on("connected", () => {
      console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    });
    mongoose.connection.on("disconnected", () => {
      console.error("MongoDB disconnected; API requests will report the database as unavailable.");
    });
    mongoose.connection.on("error", (error) => {
      console.error(`MongoDB connection error: ${error.name || "Error"}`);
    });
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.name || "Error"}. Check MONGO_URI and ensure MongoDB is running.`);
    throw error;
  }
}

module.exports = connectDatabase;
