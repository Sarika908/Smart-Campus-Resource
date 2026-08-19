/**
 * Seed script - creates one default user for each role
 * (Admin, Student, Faculty, Staff) directly in MongoDB.
 *
 * Run this once with:   node scripts/seedUsers.js
 *
 * Safe to run multiple times - it skips any user whose
 * email already exists instead of creating duplicates.
 */

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const usersToSeed = [
  {
    name: "Admin One",
    email: "admin@campus.edu",
    password: "admin123",
    role: "Admin",
  },
  {
    name: "Student One",
    email: "student@campus.edu",
    password: "student123",
    role: "Student",
  },
  {
    name: "Prof One",
    email: "faculty@campus.edu",
    password: "faculty123",
    role: "Faculty",
  },
  {
    name: "Staff One",
    email: "staff@campus.edu",
    password: "staff123",
    role: "Staff",
  },
];

const seed = async () => {
  await connectDB();

  for (const u of usersToSeed) {
    const exists = await User.findOne({ email: u.email });

    if (exists) {
      console.log(`SKIPPED (already exists): ${u.email} [${u.role}]`);
      continue;
    }

    // password gets hashed automatically by the User model's pre-save hook
    await User.create(u);
    console.log(`CREATED: ${u.email} [${u.role}] password: ${u.password}`);
  }

  console.log("\nSeeding complete. Login using the emails/passwords above.");
  mongoose.connection.close();
};

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  mongoose.connection.close();
  process.exit(1);
});