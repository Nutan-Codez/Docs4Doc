const express = require('express');
const router = express.Router();

// Route: Home Page
router.get('/', (req, res) => {
  res.render('index', { title: 'Welcome to Docs4Doc' });
});

// Route: About Page
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

// Route: Contact Page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

module.exports = router;
