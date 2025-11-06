/**
 * Seed script to populate initial data for testing
 * Run with: node scripts/seedData.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Category from '../src/models/Category.js';
import MenuItem from '../src/models/MenuItem.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const categories = [
  { name: 'Snacks', description: 'Quick bites and finger foods' },
  { name: 'Beverages', description: 'Hot and cold drinks' },
  { name: 'Meals', description: 'Full meals and combos' },
  { name: 'Desserts', description: 'Sweet treats' },
];

const menuItems = [
  // Snacks
  { name: 'Samosa', price: 15, category: 'Snacks', available: true, stock: 50 },
  { name: 'Vada Pav', price: 20, category: 'Snacks', available: true, stock: 30 },
  { name: 'Sandwich', price: 40, category: 'Snacks', available: true, stock: 25 },
  { name: 'Pakora', price: 25, category: 'Snacks', available: true, stock: 40 },
  
  // Beverages
  { name: 'Tea', price: 10, category: 'Beverages', available: true, stock: 100 },
  { name: 'Coffee', price: 15, category: 'Beverages', available: true, stock: 80 },
  { name: 'Cold Drink', price: 20, category: 'Beverages', available: true, stock: 60 },
  { name: 'Juice', price: 30, category: 'Beverages', available: true, stock: 40 },
  
  // Meals
  { name: 'Thali', price: 80, category: 'Meals', available: true, stock: 20 },
  { name: 'Biryani', price: 100, category: 'Meals', available: true, stock: 15 },
  { name: 'Fried Rice', price: 70, category: 'Meals', available: true, stock: 25 },
  { name: 'Pasta', price: 60, category: 'Meals', available: true, stock: 20 },
  
  // Desserts
  { name: 'Ice Cream', price: 30, category: 'Desserts', available: true, stock: 50 },
  { name: 'Gulab Jamun', price: 25, category: 'Desserts', available: true, stock: 40 },
  { name: 'Brownie', price: 40, category: 'Desserts', available: true, stock: 30 },
];

const users = [
  { name: 'Admin User', email: 'admin@tuckhub.com', password: 'admin123', role: 'admin' },
  { name: 'Staff Member', email: 'staff@tuckhub.com', password: 'staff123', role: 'staff' },
  { name: 'Runner One', email: 'runner@tuckhub.com', password: 'runner123', role: 'runner' },
  { name: 'Test Student', email: 'student@school.edu', password: 'student123', role: 'student' },
];

async function seed() {
  try {
    console.log('🌱 Starting seed process...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    await User.deleteMany({});

    // Seed categories
    console.log('📁 Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Seed menu items
    console.log('🍕 Creating menu items...');
    const createdItems = await MenuItem.insertMany(menuItems);
    console.log(`✅ Created ${createdItems.length} menu items`);

    // Seed users
    console.log('👥 Creating users...');
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        ...userData,
        passwordHash: hashedPassword,
      });
      console.log(`  - Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:   admin@tuckhub.com    / admin123');
    console.log('Staff:   staff@tuckhub.com    / staff123');
    console.log('Runner:  runner@tuckhub.com   / runner123');
    console.log('Student: student@school.edu   / student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
