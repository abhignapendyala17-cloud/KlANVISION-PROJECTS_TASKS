const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not configured');
  if (/DB_USER|DB_PASSWORD|xxxxx|cluster-host|<.*>/.test(uri)) {
    throw new Error('Replace the placeholder MONGO_URI in server/.env with your MongoDB Atlas connection string');
  }
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
