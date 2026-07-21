const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // Only require MongoMemoryServer dynamically if we are specifically running automated tests.
    // This prevents Vercel (which strips devDependencies) from crashing when it tries to start the server!
    if (process.env.NODE_ENV === 'test') {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        console.log('Using in-memory MongoDB for testing');
      } catch (e) {
        console.warn('Failed to load mongodb-memory-server in test mode. It might have been stripped by Vercel.');
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`CRITICAL Error connecting to MongoDB: ${error.message}`);
    // We intentionally removed process.exit(1) here so Vercel doesn't hard-crash.
  }
};

module.exports = connectDB;
