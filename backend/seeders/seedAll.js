const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = require('./adminSeeder');

const runAllSeeders = async () => {
  console.log('--- Initializing System Seeders ---');
  // Only seeds the initial authorized admin account
  await seedAdmin();
  console.log('--- Seeding Completed: Only Initial Admin account initialized ---');
};

if (require.main === module) {
  runAllSeeders();
}

module.exports = runAllSeeders;
