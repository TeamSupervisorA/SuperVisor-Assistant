const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

let mongoServer = null;

const seedDatabase = async () => {
  try {
    const User = require('../models/User');
    const Project = require('../models/Project');
    const Submission = require('../models/Submission');
    const Task = require('../models/Task');

    // Seed Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: hashedPassword, role: 'admin' });
    const supervisor = await User.create({ name: 'Supervisor', email: 'supervisor@test.com', password: hashedPassword, role: 'supervisor' });
    const student = await User.create({ name: 'Student', email: 'student@test.com', password: hashedPassword, role: 'student', studentId: 'ST123' });

    // Seed Project
    const project = await Project.create({
      title: 'AI Based Supervisor Assistant',
      description: 'A platform to manage academic research and projects.',
      status: 'active',
      supervisor: supervisor._id,
      students: [student._id]
    });

    // Seed a task
    await Task.create({
      title: 'Literature Review',
      description: 'Complete the literature review for the AI project.',
      project: project._id,
      assignedTo: student._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'todo'
    });

    // Seed a submission
    await Submission.create({
      title: 'Chapter 1 Draft',
      fileUrl: '/uploads/dummy.pdf',
      project: project._id,
      student: student._id,
      status: 'Submitted'
    });

    console.log('Seed data successfully injected into Memory DB!');
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
};

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (process.env.NODE_ENV === 'test') {
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    console.log('Using in-memory MongoDB for testing');
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Error connecting to standard MongoDB: ${error.message}. Falling back to mongodb-memory-server...`);
    try {
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`Fallback In-Memory MongoDB Connected: ${conn.connection.host}`);
      
      // Seed the database
      await seedDatabase();

    } catch (fallbackError) {
      console.error(`Error connecting to fallback MongoDB: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
