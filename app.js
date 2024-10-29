// app.js
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const path = require('path');
const Article = require('./models/Article');
const User = require('./models/User');
const { Console } = require('console');

require('dotenv').config();
// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Mongoose connection status
const db = mongoose.connection;

db.on('connected', () => {
  console.log('MongoDB connected successfully');
});

db.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Middleware setup
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
// app.use(session({
//   secret: 'secret',
//   resave: false,
//   saveUninitialized: false,
// }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));


app.use(passport.initialize());
app.use(passport.session());




// Passport configuration
require('./config/passport-config')(passport);

// Google login route
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

// Middleware to check if user is authenticated and authorized
function ensureAuthenticatedAndAuthorized(req, res, next) {
  if (req.isAuthenticated()) {
    const userGoogleId = req.user.googleId;  // Ensure consistency with `googleId`
    console.log("User Google ID from middleware:", userGoogleId);  // Log for debugging
    console.log("Allowed Google IDs (middleware):", allowedUsers); // Log allowed users

    if (allowedUsers.includes(userGoogleId)) {
      return next();  // User is allowed
    } else {
      console.log("Authenticated but not authorized");  // Debugging log
      return res.redirect('/');  // Authenticated but not authorized
    }
  }
  console.log("User not authenticated");  // Debugging log
  res.redirect('/');  // Not authenticated
}

// Add detailed logging after Google authentication callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const userGoogleId = req.user ? req.user.googleId : 'No User';
    console.log("User Google ID (from session):", userGoogleId);
    console.log("Current session data:", req.session);

    if (allowedUsers.includes(userGoogleId)) {
      console.log("User is authorized.");
      res.redirect('/uploadarticle');
    } else {
      console.log("User is NOT authorized.");
      res.redirect('/');
    }
  }
);

//Define the isAuthenticated route 
app.get('/isAuthenticated', (req, res) => {
  if (req.isAuthenticated()) {
      // Send back the user's display name along with the authenticated status
      res.json({ isAuthenticated: true, displayName: req.user.displayName });
  } else {
      res.json({ isAuthenticated: false });
  }
});


// Define an array of allowed Google IDs
const allowedUsers = ['102288906508007241851', 'GOOGLE_ID_2']; 



// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: 'uploads/', // Ensure this folder exists
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb('Error: Images only!');
  },
  limits: { fileSize: 1 * 1024 * 1024 }, // Limit: 1 MB
});


// Routes

// Admin Login Page
// app.get('/login', (req, res) => {
//   res.send(`
//     <form method="post" action="/login">
//       <input name="username" placeholder="Username" required/>
//       <input name="password" type="password" placeholder="Password" required/>
//       <button type="submit">Login</button>
//     </form>
//     <a href="/auth/google">Login with Google</a> <!-- Link for Google Login -->
//   `);
// });


// Handle Login
// app.post('/login', passport.authenticate('local', {
//   successRedirect: '/uploadarticle',
//   failureRedirect: '/login',
// }));

// Logout route
app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.log('Session destruction error:', err);
        return res.status(500).json({ error: 'Session destruction error' });
      }
      res.redirect('/'); // Redirect to home page after logging out
    });
  });
});

// Admin Route to render articles and users
app.get('/admin', ensureAuthenticatedAndAuthorized, async (req, res) => {
  try {
      const articles = await Article.find({}); // Retrieve all articles
      const users = await User.find({});       // Retrieve all users
      res.sendFile(path.join(__dirname, 'admin.html')); // Serve the admin.html file
    } catch (err) {
      console.error(`Error fetching admin data: ${err}`);
      res.status(500).send('Server Error');
  }
});

// API endpoint to fetch articles for admin
app.get('/api/admin/articles', ensureAuthenticatedAndAuthorized, async (req, res) => {
  try {
    const articles = await Article.find({});
    res.json(articles);
  } catch (err) {
    console.error(`Error fetching articles: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Article
app.get('/delete/:id', ensureAuthenticatedAndAuthorized, async (req, res) => {
  try {
      await Article.findByIdAndDelete(req.params.id);
      res.redirect('/admin');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

// Edit Article Route
app.post('/edit/:id', ensureAuthenticatedAndAuthorized, async (req, res) => {
  try {
      const { title, content, category } = req.body;
      await Article.findByIdAndUpdate(req.params.id, { title, content, category });
      res.redirect('/admin');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

// Fetch paginated articles
app.get('/api/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;  // 6 articles per page
    const skip = (page - 1) * limit;

    // Fetch the articles from the database, sorted by creation date
    const articles = await Article.find()
      .sort({ createdAt: -1 })  // Sort by newest first
      .skip(skip)
      .limit(limit)
      .select('title coverImage createdAt content')  // Select only needed fields

    // Get the total number of articles
    const totalArticles = await Article.countDocuments();

    res.json({
      articles,
      totalPages: Math.ceil(totalArticles / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(`Error fetching articles: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch single article by ID with additional fields
app.get('/api/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    const article = await Article.findById(articleId).select('title coverImage createdAt content author');

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (err) {
    console.error(`Error fetching article: ${err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// API endpoint to get recent articles
app.get('/api/recent-articles', async (req, res) => {
  try {
      const recentArticles = await Article.find()
          .sort({ createdAt: -1 }) // Sort by creation date, newest first
          .limit(5); // Limit to the most recent 5 articles

      res.json({ articles: recentArticles });
  } catch (error) {
      console.error("Error fetching recent articles: ", error);
      res.status(500).json({ message: "Internal server error" });
  }
});

// API endpoint to get recent articles For the index page
app.get('/api/recent-articles/index', async (req, res) => {
  try {
      const articles = await Article.find().sort({ createdAt: -1 }).limit(3); // Fetch the 3 most recent articles
      res.json({ articles });
  } catch (error) {
      console.error("Error fetching recent articles for index: ", error);
      res.status(500).json({ message: "Error fetching recent articles for index" });
  }
});

// Protect the /uploadarticle route
app.get('/uploadarticle', ensureAuthenticatedAndAuthorized, (req, res) => {
  res.sendFile(path.join(__dirname, 'uploadArticle.html'));
});


// Handle Article Upload
app.post('/upload-article', ensureAuthenticatedAndAuthorized, upload.single('coverImage'), async (req, res) => {  //ensureAuthenticated,
  try {
    const { title, hashtags, category, content, author } = req.body;
    const coverImage = req.file ? req.file.filename : '';

    // Create a new article instance
    const newArticle = new Article({
      title,
      hashtags: hashtags.split(',').map(tag => tag.trim()),
      category,
      content,
      coverImage,
      author,
    });

    // Save the article to the database
    await newArticle.save();
    
    // Redirect back to the form or another page after success
    res.redirect('/uploadarticle?success=true');

  } catch (err) {
    console.error(`Error uploading article: ${err}`);
    res.redirect('/uploadarticle?error=true');
  }
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve index.html from root when the root URL is accessed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

