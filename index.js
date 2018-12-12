const port = 3000;
const path = require('path');
const bodyParser = require('body-parser');
const hb = require('express-handlebars');
const express = require('express');
const Router = require('express-promise-router');
const router = new Router();
const { Client } = require('pg');
const app = express();

const db = require('./db');

app.engine('handlebars', hb({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '/public'))); // Used to access css file(s)

// Routes
app.use('/file', require('./file'));
app.use('/files', require('./files'));
app.use('/inbox', require('./inbox'));
app.use('/profile', require('./profile'));
app.use('/blacklist', require('./blacklist'));
app.use('/users', require('./users'));

// Landing page.
app.get('/', (req, res) => {
  res.render('login');
});

// Profile creation page for new users.
app.get('/create_profile', (req, res) => {
  res.render('create_profile');
});

// Creates blacklist page for taboo words
app.get('/blacklist', (req, res) => {
  res.render('blacklist');
});

// Creates new file with default values and inserts it to database.
app.post('/create_new_file', async (req, res) => {
  var rows = await db.insertNewFile([app.get('userId')]);
  res.redirect('/file/' + rows[0].id);
});

// Creating a new user.
app.post('/create_user', async (req, res) => {
  const username = req.body.username2;
  const email = req.body.email2;
  const password = req.body.password2;
  var rows = await db.insertNewUser([username, email, password]);
  var userId = rows[0].id;
  app.set('userId', userId); // App sets logged-in user to the new user.
  app.set('username', username);
  console.log('New user created. User Id: ' + userId);
  res.redirect('/create_profile');
});

// Creates a new profile for the new user.
app.post('/create_profile', (req, res) => {
  const userId = app.get('userId');
  const name = req.body.name;
  const picture_url = req.body.picture_url;
  const bio = req.body.bio;
  db.insertNewProfile([userId, name, picture_url, bio]);
  console.log('New profile created for user: ' + userId);
  res.redirect('/profile/' + userId);
});

// Logs in the user if their username and email exist within the database.
// Password is ommitted for demonstration and due to lack of security.
// Should probably add password later though.
app.post('/login_user', async (req, res) => {
  const username = req.body.username1;
  const password = req.body.password1;
  var rows = await db.getLoginInfo([username, password]);

  // No login credentials match. Invalid user.
  if (rows.length == 0) {
    res.redirect('back');
    return;
  }

  var userId = rows[0].id;
  var userType = await db.getUserType([username]);
  app.set('userId', userId);
  app.set('username', username);
  app.set('userType', userType);

  // Checks to see if the user has created a profile.
  var isProfileExists = await db.checkProfileExists([userId]);
  if (!isProfileExists) {
    res.redirect('/create_profile');
    return;
  }

  res.redirect('/files/' + userId);
});

const hbs = hb.create();

hbs.getPartials().then(function(partials) {
  console.log(partials);
});

app.listen(port);
