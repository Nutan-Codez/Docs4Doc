const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const upload = require('./multer'); // File upload configuration
const profilePic = require('./multer2'); // Profile picture upload configuration
const userModel = require('./models/users'); // User schema
const doctorModel = require('./models/doctors'); // Doctor schema
const fileModel = require('./models/file'); // File schema
const bioModel = require('./models/bio'); // Bio schema

// Passport.js Configuration
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await userModel.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid username or password' });
      }
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Middleware to Check if User is Logged In
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Middleware to Check if User is Admin
function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin-login');
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
    const { username, name, email, password } = req.body;

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds
    const userData = new userModel({
      username,
      name,
      email,
      password: hashedPassword, // Store the hashed password
    });

    await userData.save();

    passport.authenticate('local', (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
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

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).send('An error occurred during login.');
    }
    if (!user) {
      return res.render('login', { message: info.message || 'Invalid username or password' });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error during session creation:', err);
        return res.status(500).send('An error occurred while creating a session.');
      }
      res.redirect('/profile');
    });
  })(req, res, next);
});

// Profile Route (Protected)
router.get('/profile', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findOne({ username: req.session.passport.user })
      .populate('file')
      .populate('bio');
    const state = req.query.state || 0;
    res.render('profile', { state, user });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.redirect('/login');
  }
});

// File Upload Routes
router.get('/upload', isLoggedIn, (req, res) => {
  res.render('upload');
});

router.post('/upload', isLoggedIn, upload.single('file'), async (req, res) => {
  try {
    // Fetch the user and populate the 'bio' field
    const user = await userModel.findOne({ username: req.session.passport.user }).populate('bio');
    
    // Check if user exists
    if (!user) {
      console.error('User not found');
      return res.status(404).send('User not found');
    }

    const bio = user.bio;
    if (!bio || !bio.doctor) {
      console.error('Doctor information missing in user bio');
      return res.status(400).send('Doctor information missing');
    }

    // Create the file entry
    const file = await fileModel.create({
      file: req.file.filename,
      user: user._id,
      description: req.body.description,
      doctor: bio.doctor,
    });

    // Ensure files array exists and associate the file with the user
    if (!Array.isArray(user.file)) {
      user.file = [];
    }
    user.file.push(file._id); // Save only the file ID for reference
    await user.save();
    console.log('uploaded file'+'')
    console.log('File uploaded successfully:', file);
    res.redirect('/profile');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('An error occurred while uploading the file.');
  }
});



// Bio Routes
router.get('/bio', isLoggedIn, async (req, res) => {
    try {
      // Fetch all doctors from the database
      const doctors = await doctorModel.find({});
  
      // Render the 'bio' page and pass the doctors data to the view
      res.render('bio', { doctors });
    } catch (err) {
      console.error('Error fetching doctors:', err);
      res.status(500).send('An error occurred while fetching doctors.');
    }
  });
  

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

router.post('/bio', isLoggedIn, async (req, res) => {
  try {
    const { doctor, dateOfBirth, aadharNumber, contactNumber } = req.body;

    // Validate input fields
    if (!doctor || !dateOfBirth || !aadharNumber || !contactNumber) {
      return res.status(400).send('All fields are required.');
    }

    // Calculate age

    const age = calculateAge(dateOfBirth);

    // Create a new Bio document
    const newBio = new bioModel({
      user: req.user._id, // Assuming `req.user` is populated by Passport.js
      doctor:doctor,
      dateOfBirth:dateOfBirth,
      aadharNumber:aadharNumber,
      contactNumber:contactNumber,
      age:age,
    });

    await newBio.save();

    // Update the user's bio field
    const user = await userModel.findById(req.user._id); // Retrieve user
    if (!user) {
      return res.status(404).send('User not found.');
    }

    user.bio = newBio._id; // Link the new bio to the user
    await user.save();

    // Redirect to the profile page
    res.redirect('/profile');
  } catch (err) {
    console.error('Error saving bio:', err);
    res.status(500).send('An error occurred while saving bio.');
  }
});


// Add Doctor Routes
router.get('/add-doctor', isAdmin, (req, res) => {
  res.render('addDoctor');
});

router.post('/add-doctor', isAdmin, profilePic.single('picture'), async (req, res) => {
  try {
    const { name, email, password, phoneNo } = req.body;
    const picture = req.file ? req.file.filename : 'default.jpg';

    // Validate phone number length
    if (phoneNo.length !== 10) {
      return res.status(400).send('Phone number must be 10 digits.');
    }

    // Hash the password with bcrypt
    const saltRounds = 10; // Define the number of salt rounds
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new doctor document with hashed password
    const newDoctor = new doctorModel({
      name,
      email,
      password: hashedPassword, // Save hashed password
      phoneNo,
      picture,
    });

    // Save the new doctor to the database
    await newDoctor.save();
    res.redirect('/add-doctor'); // Redirect after successful creation
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate email error
      res.status(400).send('Doctor with this email already exists.');
    } else {
      console.error(error);
      res.status(500).send('An error occurred while adding the doctor.');
    }
  }
});
// Admin Routes
router.get('/admin-login', (req, res) => {
  res.render('admin-login');
});

router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    req.session.isAdmin = true;
    res.redirect('/add-doctor');
  } else {
    res.render('admin-login', { message: 'Invalid credentials' });
  }
});

router.get('/admin-logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send('Error logging out');
    res.redirect('/');
  });
});
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send('Error logging out');
    res.redirect('/');
  });
});
router.get('/user-reports',(req,res)=>{res.render('finduser');})
// Report Routes
router.post('/user-reports', isAdmin, async (req, res) => {
  const aadharNumber = req.body.aadhar;
  try {
    const bio = await bioModel.findOne({ aadharNumber });
    if (!bio) {
      return res.render('error', { message: 'User not found with the given Aadhar number' });
    }

    const user = await userModel.findById(bio.user).populate('file').populate('bio');
    if (!user) {
      return res.render('error', { message: 'User not found in the database' });
    }

    res.render('userReports', { user });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).send('An error occurred while fetching user data.');
  }
});

// Select Doctor Route
router.get('/select-doctor', isLoggedIn, async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    res.render('selectDoctor', { doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).send('Error fetching doctors.');
  }
});

// Route to Save Selected Doctor in User's Bio
router.post('/select-doctor', isLoggedIn, async (req, res) => {
  try {
    const selectedDoctorId = req.body.doctorId;
    const user = await userModel.findOne({ username: req.session.passport.user }).populate('bio');

    if (!user.bio) {
      return res.status(400).send('Please complete your bio first.');
    }

    user.bio.doctor = selectedDoctorId;
    await user.bio.save();

    res.redirect('/profile');
  } catch (err) {
    console.error('Error selecting doctor:', err);
    res.status(500).send('An error occurred while selecting the doctor.');
  }
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

module.exports = router;
