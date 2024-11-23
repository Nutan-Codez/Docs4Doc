// users.js
const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
const dotenv=require('dotenv');
dotenv.config(); // Import the database URI from env file

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Database connection established'))
  .catch(err => console.error('Database connection error:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: String,
  email: String,
  password: { type: String }, // Passport-Local-Mongoose will handle hashing
  profileImage: { type: String, default:'default.png'},
  bio: { type: mongoose.Schema.Types.ObjectId, ref: 'Bio' },
  file: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }], // References to reports
  allergies: [{ type: String }],
});

// Apply Passport-Local-Mongoose Plugin
userSchema.plugin(plm);

// Export User Model
module.exports = mongoose.model('User', userSchema);
