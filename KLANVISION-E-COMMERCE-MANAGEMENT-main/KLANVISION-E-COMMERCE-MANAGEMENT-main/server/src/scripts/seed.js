require('../config/loadEnv');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const products = [
  { productId: 'AUDIO-101', name: 'Studio Wireless Headphones', category: 'Electronics', price: 129.99, quantity: 24, description: 'Comfortable over-ear headphones with rich sound and long battery life.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85' },
  { productId: 'HOME-204', name: 'Ceramic Pour-over Set', category: 'Home', price: 42.5, quantity: 8, description: 'A handcrafted dripper and server set for a thoughtful morning brew.', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85' },
  { productId: 'BAG-312', name: 'Everyday Canvas Tote', category: 'Fashion', price: 34, quantity: 0, description: 'A durable, reusable canvas bag with an inside pocket.', imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85' },
  { productId: 'TECH-415', name: 'Compact Mechanical Keyboard', category: 'Electronics', price: 89, quantity: 3, description: 'A tactile compact keyboard for focused work and play.', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85' },
  { productId: 'LIFE-520', name: 'Insulated Travel Bottle', category: 'Sports', price: 28.95, quantity: 16, description: 'A leak-resistant stainless steel bottle that keeps drinks cold or hot.', imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85' },
  { productId: 'DESK-611', name: 'Minimal Desk Lamp', category: 'Home', price: 64.99, quantity: 11, description: 'A dimmable task lamp with a warm, adjustable light.', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85' }
];

if (!process.env.MONGO_URI || /DB_USER|DB_PASSWORD|xxxxx|cluster-host|<.*>/.test(process.env.MONGO_URI)) {
  console.error('Replace the placeholder MONGO_URI in server/.env with your MongoDB Atlas connection string');
  process.exit(1);
}
if (!process.env.ADMIN_EMAIL || /replace-with|your-email/i.test(process.env.ADMIN_EMAIL) ||
    !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.startsWith('replace-with-')) {
  console.error('Set ADMIN_EMAIL and a unique ADMIN_PASSWORD in server/.env before running the seed script');
  process.exit(1);
}
if (process.env.ADMIN_PASSWORD.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters');
  process.exit(1);
}

connectDB()
  .then(async () => {
    await Product.bulkWrite(products.map((product) => ({
      updateOne: { filter: { productId: product.productId }, update: { $setOnInsert: product }, upsert: true }
    })));
    console.log(`Seeded ${products.length} products`);
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await User.findOneAndUpdate(
      { email },
      { $set: { name: 'Store Administrator', passwordHash, role: 'admin' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Administrator account ready for ${email}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  });
