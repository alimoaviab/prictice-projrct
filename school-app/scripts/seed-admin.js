import mongoose from 'mongoose';
import crypto from 'node:crypto';

// Configuration
const MONGODB_URI = 'mongodb+srv://abdul:12345454545@cluster0.dglgx3f.mongodb.net/?appName=Cluster0';
const ADMIN_EMAIL = 'admin@school.com';
const ADMIN_PASSWORD = 'admin123';
const SCHOOL_ID = 'default-school';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    // Define Schema (minimal for seeding)
    const UserSchema = new mongoose.Schema({
      school_id: String,
      email: String,
      password_hash: String,
      role: String,
      status: String,
      profile: {
        first_name: String,
        last_name: String
      }
    }, { collection: 'users' });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`Admin user with email ${ADMIN_EMAIL} already exists.`);
      process.exit(0);
    }

    const passwordHash = hashPassword(ADMIN_PASSWORD);

    await User.create({
      school_id: SCHOOL_ID,
      email: ADMIN_EMAIL,
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      profile: {
        first_name: 'Default',
        last_name: 'Admin'
      }
    });

    console.log('-----------------------------------');
    console.log('SUCCESS: Admin account created!');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('-----------------------------------');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
