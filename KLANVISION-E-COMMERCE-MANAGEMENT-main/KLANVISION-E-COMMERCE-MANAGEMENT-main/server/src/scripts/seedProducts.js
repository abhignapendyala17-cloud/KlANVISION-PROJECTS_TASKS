require('../config/loadEnv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

const products = [
  { productId: 'ELEC-001', name: 'Studio Wireless Headphones', category: 'Electronics', price: 7499, quantity: 24, description: 'Comfortable over-ear headphones with rich sound and long battery life.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85' },
  { productId: 'ELEC-002', name: 'Compact Mechanical Keyboard', category: 'Electronics', price: 6299, quantity: 12, description: 'A tactile compact keyboard made for focused work and play.', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85' },
  { productId: 'ELEC-003', name: 'Pocket Bluetooth Speaker', category: 'Electronics', price: 3299, quantity: 18, description: 'Clear, room-filling sound in a portable water-resistant design.', imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85' },
  { productId: 'ELEC-004', name: 'Everyday Smart Watch', category: 'Electronics', price: 8999, quantity: 9, description: 'A clean, comfortable smartwatch with activity and sleep tracking.', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85' },

  { productId: 'FASH-001', name: 'Everyday Canvas Tote', category: 'Fashion', price: 1499, quantity: 20, description: 'A sturdy reusable canvas tote with room for daily essentials.', imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85' },
  { productId: 'FASH-002', name: 'Classic Leather Wallet', category: 'Fashion', price: 2199, quantity: 14, description: 'A slim wallet with thoughtful card storage and a timeless finish.', imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85' },
  { productId: 'FASH-003', name: 'Soft Knit Everyday Scarf', category: 'Fashion', price: 1899, quantity: 11, description: 'A lightweight, soft-touch scarf for easy year-round layering.', imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=85' },
  { productId: 'FASH-004', name: 'Minimal Crossbody Bag', category: 'Fashion', price: 2799, quantity: 8, description: 'A compact crossbody bag with an adjustable strap and zip closure.', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85' },

  { productId: 'HOME-001', name: 'Ceramic Pour-over Set', category: 'Home', price: 2499, quantity: 13, description: 'A ceramic dripper and server set for a slower morning coffee.', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85' },
  { productId: 'HOME-002', name: 'Minimal Desk Lamp', category: 'Home', price: 3499, quantity: 10, description: 'An adjustable warm-light lamp for desks, reading nooks, and bedside tables.', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85' },
  { productId: 'HOME-003', name: 'Linen Cushion Cover', category: 'Home', price: 999, quantity: 25, description: 'A breathable linen cushion cover in a versatile natural tone.', imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85' },
  { productId: 'HOME-004', name: 'Scented Soy Candle', category: 'Home', price: 799, quantity: 0, description: 'A clean-burning soy candle with a calm botanical fragrance.', imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85' },

  { productId: 'BOOK-001', name: 'The Art of Slow Living', category: 'Books', price: 599, quantity: 16, description: 'A practical, beautifully illustrated guide to making room for what matters.', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85' },
  { productId: 'BOOK-002', name: 'Everyday Home Cooking', category: 'Books', price: 749, quantity: 12, description: 'Approachable recipes and kitchen techniques for everyday meals.', imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=85' },
  { productId: 'BOOK-003', name: 'A Field Guide to Plants', category: 'Books', price: 899, quantity: 7, description: 'A friendly illustrated introduction to common indoor and outdoor plants.', imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=85' },
  { productId: 'BOOK-004', name: 'Creative Journaling', category: 'Books', price: 499, quantity: 21, description: 'Prompts and simple exercises to build a thoughtful daily writing habit.', imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85' },

  { productId: 'SPRT-001', name: 'Insulated Travel Bottle', category: 'Sports', price: 1299, quantity: 19, description: 'A leak-resistant stainless steel bottle that keeps drinks cold or hot.', imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85' },
  { productId: 'SPRT-002', name: 'Everyday Yoga Mat', category: 'Sports', price: 2199, quantity: 10, description: 'A supportive, grippy mat for stretching, yoga, and home workouts.', imageUrl: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=900&q=85' },
  { productId: 'SPRT-003', name: 'Lightweight Training Bag', category: 'Sports', price: 1899, quantity: 15, description: 'A durable gym duffel with separate space for shoes and essentials.', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85' },
  { productId: 'SPRT-004', name: 'Resistance Band Set', category: 'Sports', price: 899, quantity: 23, description: 'Three resistance levels for portable strength and mobility training.', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85' },

  { productId: 'BEAU-001', name: 'Daily Hydration Face Cream', category: 'Beauty', price: 1199, quantity: 17, description: 'A lightweight daily moisturizer for soft, comfortable skin.', imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85' },
  { productId: 'BEAU-002', name: 'Botanical Hand Wash', category: 'Beauty', price: 499, quantity: 26, description: 'A gentle, plant-inspired hand wash with a fresh, clean scent.', imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=900&q=85' },
  { productId: 'BEAU-003', name: 'Everyday Lip Balm Set', category: 'Beauty', price: 399, quantity: 31, description: 'A nourishing two-piece lip balm set for daily care on the go.', imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85' },
  { productId: 'BEAU-004', name: 'Gentle Cleansing Oil', category: 'Beauty', price: 899, quantity: 6, description: 'A gentle cleansing oil that lifts away daily makeup and impurities.', imageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85' },

  { productId: 'GROC-001', name: 'Single-origin Coffee Beans', category: 'Groceries', price: 699, quantity: 22, description: 'Freshly roasted whole beans with a balanced, chocolatey finish.', imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=85' },
  { productId: 'GROC-002', name: 'Raw Forest Honey', category: 'Groceries', price: 449, quantity: 18, description: 'Small-batch raw honey with a naturally rich floral taste.', imageUrl: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=900&q=85' },
  { productId: 'GROC-003', name: 'Artisan Pasta Bundle', category: 'Groceries', price: 599, quantity: 14, description: 'A trio of slow-dried pasta shapes for an easy pantry meal.', imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85' },
  { productId: 'GROC-004', name: 'Premium Mixed Nuts', category: 'Groceries', price: 549, quantity: 0, description: 'A satisfying mix of roasted nuts packed fresh for everyday snacking.', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85' },

  { productId: 'TOYS-001', name: 'Wooden Building Blocks', category: 'Toys', price: 1499, quantity: 13, description: 'Smooth, colorful wooden blocks that encourage open-ended play.', imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=900&q=85' },
  { productId: 'TOYS-002', name: 'Classic Jigsaw Puzzle', category: 'Toys', price: 799, quantity: 9, description: 'A 500-piece illustrated puzzle for a relaxed screen-free evening.', imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=900&q=85' },
  { productId: 'TOYS-003', name: 'Friendly Plush Bear', category: 'Toys', price: 999, quantity: 16, description: 'A soft, huggable plush companion made for little adventures.', imageUrl: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=900&q=85' },
  { productId: 'TOYS-004', name: 'Creative Art Kit', category: 'Toys', price: 1199, quantity: 11, description: 'A colorful starter set for drawing, painting, and creative afternoons.', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85' }
];

async function seedProducts() {
  try {
    await connectDB();
    const result = await Product.bulkWrite(products.map((product) => ({
      updateOne: {
        filter: { productId: product.productId },
        update: { $setOnInsert: product },
        upsert: true
      }
    })));
    console.log(`Product seed complete: ${result.upsertedCount} added, ${products.length - result.upsertedCount} already existed; existing records were left unchanged.`);
  } catch (error) {
    console.error('Product seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

seedProducts();
