const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const AdminUser = require('./models/AdminUser');
const { hashPassword } = require('./utils/authUtils');

// Load .env from project root
dotenv.config({
    path: path.join(__dirname, '../.env')
});

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
};

const seedAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log('MongoDB connected');

        const email = 'admin@college.com';
        const password = 'Admin@12345';

        const existingAdmin = await AdminUser.findOne({ email });

        if (existingAdmin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        const passwordHash = await hashPassword(password);

        await AdminUser.create({
            email,
            passwordHash
        });

        console.log('=================================');
        console.log('Admin created successfully');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('=================================');

        process.exit(0);

    } catch (error) {
        console.error('Seed Admin Error:', error);
        process.exit(1);
    }
};

seedAdmin();