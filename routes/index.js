const express = require('express');
const router = express.Router();
const userModel = require('./users');
const fileModel = require('./file');
const bioModel = require('./bio');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const upload = require('./multer'); // Ensure multer is properly configured
const profilePic = require('./multer2'); // Ensure multer is properly configured
const users = require('./users');

// Passport.js Configuration
passport.use(new LocalStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Middleware to Check if User is Logged In
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Home Page Route
router.get('/', (req, res) => {
  res.render('index');
});

// Register Routes
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res, next) => {
  try {
    const userData = new userModel({
      username: req.body.username,
      name: req.body.name,
      email: req.body.email
    });

    await userModel.register(userData, req.body.password);

    passport.authenticate('local', (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        console.log("User already exists");
        return res.redirect('/register');
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/bio');
      });
    })(req, res, next);
  } catch (err) {
    console.error('Error during registration:', err);
    res.redirect('/register');
  }
});

// Login Routes
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
}));

// Profile Route (Protected)
router.get('/profile', isLoggedIn, async (req, res) => {
  try {
    // Fetch the user from the database and populate related fields
    const user = await userModel.findOne({ username: req.session.passport.user })
      .populate('files')
      .populate('bio');

    // Extract state from query parameter, default to 0 if not provided
    const state = req.query.state || 0;

    // Log the state and user for debugging
    console.log('State:', state);
    console.log('User:', user);

    // Render the profile view with user and state data
    res.render('profile', { state, user });
  } catch (err) {
    // Log error and redirect to login if there's an issue
    console.error('Error loading profile:', err);
    res.redirect('/login');
  }
});

// Upload Routes
router.get('/upload', isLoggedIn, (req, res) => {
  res.render('upload');
});

router.post('/upload', isLoggedIn, upload.single('file'), async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const file = await fileModel.create({
      file: req.file.filename,
      user: user._id,
      description: req.body.description
    });
    user.files.push(file);
    await user.save();
    res.redirect('/profile');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('An error occurred while uploading the file.');
  }
});

// Bio Routes
router.get('/bio', isLoggedIn, (req, res) => {
  res.render('bio'); // Render the bio form
});

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // Adjust age if the birth date has not yet occurred this year
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

router.post('/bio', isLoggedIn, async (req, res) => {
  try {
    let dob = req.body.dateOfBirth;
    let calcAge = calculateAge(dob);
    const user = await userModel.findOne({ username: req.session.passport.user });
    const bio = await bioModel.create({
      doctor: {
        name: req.body.doctorName,
        contactNumber: req.body.doctorContactNumber
      },
      user: user._id,
      dateOfBirth: dob,
      age: calcAge,
      aadharNumber: req.body.aadharNumber,
      contactNumber: req.body.contactNumber
    });
    user.bio = bio;
    await user.save();
    res.redirect('/profile');
  } catch (error) {
    console.error('Error saving bio:', error);
    res.status(500).send('An error occurred while saving the bio.');
  }
});

// Allergies Route
router.post('/add-allergies', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    user.allergies.push(req.body.allergy);
    await user.save();
    res.redirect('/profile'); // Redirect or send response as needed
  } catch (error) {
    console.error('Error adding allergies:', error);
    res.status(500).send('An error occurred while adding allergies.');
  }
});

// Update State Route
router.post('/profile', (req, res) => {
  const state = req.body.state; // Update the state based on the POST request
  res.redirect(`/profile?state=${state}`); // Redirect to the profile page with updated state
});

// Logout Route
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) { return next(err); }
    req.session.destroy(err => {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });
});

router.get('/profilechange', isLoggedIn, (req, res) => { res.render('Updateprofile') })
router.post('/profilechange', isLoggedIn, profilePic.single('image'), async (req, res) => {
  try {
    // Find the user based on the session username
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Check if the file was uploaded
    if (req.file) {
      // Update the user's profile image with the filename
      user.profileImage = req.file.filename;
    } else {
      // Handle cases where no file was uploaded, if needed
      console.log('No file uploaded');
    }

    // Save the updated user object
    await user.save();

    // Redirect to the profile page
    res.redirect('/profile');
  } catch (error) {
    console.error('Error changing profile image:', error);
    res.status(500).send('An error occurred while changing the profile image.');
  }
});
router.get('/about', (req, res) => {
  res.render('about');
})
router.get('/admin-login', (req, res) => {
  res.render('admin-login');
})

router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    // Setting session variable to indicate admin is logged in
    req.session.isAdmin = true; 
    res.render('finduser'); // Redirect to find user page after successful login
  } else {
    // If login fails, show error message
    res.render('admin-login', { message: 'Invalid credentials' });
  }
});
router.get('/admin-logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/admin-login'); // Redirect to login page after logout
  });
});



// Protect the /user-reports route with admin authorization middleware
router.post('/user-reports', isAdmin, async (req, res) => {
  const aadharNumber = req.body.aadhar; // Get Aadhar from body of the request

  try {
    // Find the bio document by Aadhar number
    const bio = await bioModel.findOne({ "aadharNumber": aadharNumber });

    if (!bio) {
      // If no bio found for the given Aadhar, render error page
      return res.render('error', { message: 'User not found with the given Aadhar number' });
    }

    // Find the user associated with the found bio
    const user = await userModel.findById(bio.user).populate('files').populate('bio'); // Populating both files and bio

    if (!user) {
      // If user not found with the given bio user ID, render error page
      return res.render('error', { message: 'User not found in the database' });
    }

    // If user is found, render their reports page
    res.render('admin', { user: user });

  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).send('An error occurred while fetching user data.');
  }
});

// Admin authentication middleware
function isAdmin(req, res, next) {
  // Check if user is logged in and is an admin
  if (req.session.isAdmin) {
    return next(); // Admin user is authenticated, proceed to the next route
  } else {
    // If not an admin, redirect to admin login page
    return res.redirect('/admin-login');
  }
}




module.exports = router;
