const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const { hashPassword } = require('../utils/authUtils');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_quiz_system';
    await mongoose.connect(mongoUri);

    const email = (process.env.INITIAL_ADMIN_EMAIL || 'abdoelshikh144@gmail.com').trim().toLowerCase();
    const rawPassword = process.env.INITIAL_ADMIN_PASSWORD || '123456789';

    const existingAdmin = await AdminUser.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin account already exists for ${email}`);
      return;
    }

    const passwordHash = await hashPassword(rawPassword);
    await AdminUser.create({
      email,
      passwordHash,
    });

    console.log(`Initial admin account created successfully for ${email}`);
  } catch (error) {
    console.error('Admin Seeder Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
