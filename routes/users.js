// users.js
const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
const { MONGO_DATABASE_URI } = require('./keys'); // Import the database URI from keys file

// Connect to MongoDB
mongoose.connect(MONGO_DATABASE_URI, {
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
  bio: { type: mongoose.Schema.Types.ObjectId, ref: 'Bio' }, // Single reference to Bio schema
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'file' }], // References to uploaded files
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'file' }], // References to reports
  allergies: [{ type: String }],
});

// Apply Passport-Local-Mongoose Plugin
userSchema.plugin(plm);

// Export User Model
module.exports = mongoose.model('User', userSchema);
