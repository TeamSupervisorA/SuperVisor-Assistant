const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoServer = null;

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  // Only require MongoMemoryServer dynamically if we are specifically running automated tests.
  // This prevents Vercel (which strips devDependencies) from crashing when it tries to start the server!
  if (process.env.NODE_ENV === 'test') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    console.log('Using in-memory MongoDB for testing');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // We intentionally fail here instead of falling back to a fake database.
    // If the real database fails, Vercel SHOULD show a proper error so we can fix it!
    process.exit(1);
  }
};

module.exports = connectDB;
