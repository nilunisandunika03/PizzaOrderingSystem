require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pizza_ordering_system')
  .then(async () => {
    const User = require('./database/models/User');
    const users = await User.find({}).select('email is_verified created_at');
    console.log('Total Users in Database:', users.length);
    console.log('================================');
    users.forEach(u => {
      console.log(`Email: ${u.email}`);
      console.log(`  Verified: ${u.is_verified}`);
      console.log(`  Created: ${u.created_at}`);
      console.log('---');
    });
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
