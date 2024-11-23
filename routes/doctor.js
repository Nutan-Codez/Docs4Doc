const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const Doctor = require('./models/doctors');
const router = express.Router();

// Middleware to check if the user is authenticated as a doctor
function isDoctor(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // Proceed to the next middleware or route handler
  } else {
    return res.redirect('/doctor/login'); // Redirect to login page if not authenticated
  }
}

// Configure Passport.js
passport.use('doctor-local', new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      console.time('login-query');
      const doctor = await Doctor.findOne({ email });
      console.timeEnd('login-query');
      
      if (!doctor) {
        return done(null, false, { message: 'Email not registered' });
      }

      console.time('password-compare');
      const isMatch = await bcrypt.compare(password, doctor.password);
      console.timeEnd('password-compare');

      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password' });
      }

      return done(null, doctor); // Successful authentication
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize the doctor
passport.serializeUser((user, done) => done(null, user.id));

// Deserialize the doctor
passport.deserializeUser(async (id, done) => {
  try {
    console.time('deserialize-query');
    const doctor = await Doctor.findById(id);
    console.timeEnd('deserialize-query');
    done(null, doctor);
  } catch (err) {
    done(err);
  }
});

// Routes
router.get('/dashboard', isDoctor, (req, res) => {
  res.render('doctor-dashboard');
});

router.get('/login', (req, res) => {
  res.render('doctor-login');
});

// Define the Doctor Login Route
router.post('/login', (req, res, next) => {
  passport.authenticate('doctor-local', (err, doctor, info) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).send('An error occurred during login.');
    }
    if (!doctor) {
      return res.render('doctor-login', { message: info.message || 'Invalid email or password' });
    }
    req.logIn(doctor, (err) => {
      if (err) {
        console.error('Error during session creation:', err);
        return res.status(500).send('An error occurred while creating a session.');
      }
      res.redirect('/doctor/dashboard');
    });
  });
});

module.exports = router;
