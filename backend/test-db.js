require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const u = await User.findOne({name: /nazmul/i});
    console.log('User:', u?._id, 'Institution:', u?.institution);
    
    const p = await Project.findOne({ title: /adfhkkgf/i });
    console.log('Project:', p?._id, 'Institution:', p?.institution, 'Students:', p?.students, 'Supervisor:', p?.supervisor);
    
    if (u && p) {
      console.log('Is student in project?', p.students.some(s => s.toString() === u._id.toString()));
      console.log('Same institution?', String(u.institution) === String(p.institution));
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
});
