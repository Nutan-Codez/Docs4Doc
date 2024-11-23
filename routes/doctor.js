const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Doctor = require('./models/doctors'); // Ensure this file contains the Doctor schema
const User = require('./models/users'); // Assuming this file contains the User schema
const File = require('./models/file'); // Assuming this file contains the File schema
const Bio = require('./models/bio'); 
const router = express.Router();

// Middleware for parsing JSON and form data
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Simulated logged doctor (simple variable for session-like behavior)
let loggedDoctor = null;

// Middleware to check if a doctor is authenticated
function checkAuthentication(req, res, next) {
  if (!loggedDoctor) {
    return res.status(401).json({ message: 'You are not logged in.' });
  }
  req.loggedDoctor = loggedDoctor; // Attach loggedDoctor to req object
  next();
}

// Route for doctor login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the doctor exists in the database
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Simulate login
    loggedDoctor = { id: doctor._id, email: doctor.email, name: doctor.name };
    res.redirect('/doctor/doctor-files');
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});



// Route for doctor logout
router.post('/logout', (req, res) => {
  loggedDoctor = null; // Clear logged-in doctor
  res.json({ message: 'Logged out successfully' });
});

// Route to render the login page
router.get('/login', (req, res) => {
  res.render('doctor-login');
});

// Route for patient files
router.get('/doctor-files', checkAuthentication, async (req, res) => {
  const doctorId = req.loggedDoctor.id; // Assuming the logged-in doctor's ID is in req.loggedDoctor

  try {
    // Fetch all files where the doctor ID matches the logged-in doctor
    const files = await File.find({ doctor: doctorId })
      .populate({
        path: 'user', // Populate the user field (patient)
        select: 'name email phoneNo profileImage allergies', // Select patient fields
      })
      .populate({
        path: 'doctor', // Populate doctor field if needed (though this may be redundant as you already know the doctor)
        select: 'name email',
      });

    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No files found for this doctor' });
    }

    // Map files to a more readable format
    const doctorFiles = files.map(file => ({
      fileName: file.file,
      description: file.description,
      status: file.status,
      date: file.date,
      patient: {
        name: file.user.name,
        email: file.user.email,
        phoneNo: file.user.phoneNo,
        profileImage: file.user.profileImage,
        allergies: file.user.allergies,
      },
    }));

    // Render doctor-dashboard with the files of the doctor
    res.render('doctor-dashboard', {
      doctor: {
        name: req.loggedDoctor.name,
        email: req.loggedDoctor.email,
        files: doctorFiles, // List of files associated with the doctor
      }
    });

  } catch (err) {
    console.error('Error fetching files for doctor:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});













module.exports = router;
