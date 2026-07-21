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
    console.error(`CRITICAL Error connecting to MongoDB: ${error.message}`);
    console.error(`URI was: ${uri ? "Provided" : "UNDEFINED!"}`);
    // We intentionally removed process.exit(1) here so Vercel doesn't hard-crash.
  }
};

module.exports = connectDB;
