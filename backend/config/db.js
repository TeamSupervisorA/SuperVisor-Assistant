const mongoose = require('mongoose');

let mongoServer = null;
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    let uri = process.env.MONGODB_URI;
    if (process.env.NODE_ENV === 'test') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }
    if (!uri) throw new Error('MONGODB_URI is not configured');

    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection.connection;
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

const getDatabaseStatus = () => mongoose.connection.readyState === 1 ? 'connected' : 'unavailable';

module.exports = { connectDB, getDatabaseStatus };
