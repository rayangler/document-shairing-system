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
app.use('/files', require('./files'));
app.use('/file', require('./file'));

// Local functions:
// Loads users' files in /files/:id
function loadFilesPage(res, results) {
  var data = {};
  console.log(results);
  data.rows = results.rows;
  data.name = results.rows[0].name;
  data.user_id = app.get('userId');
  console.log(data);
  res.render('files', {data});
}

// Landing page.
app.get('/', (req, res) => {
  res.render('login');
});

// Profile from navbar. Redirects to logged in user's profile page.
app.get('/profile', (req, res) => {
  if (!app.get('userId')) {
    res.redirect('/');
    return;
  }
  res.redirect('/profile/' + app.get('userId'));
});

// Profile creation page for new users.
app.get('/create_profile', (req, res) => {
  res.render('create_profile');
});

// Profile page for user with id in params.
app.get('/profile/:id', (req, res) => {
  const id = req.params.id;
  client.query(queryProfilePage, [id], (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      var data = results.rows[0];
      console.log(data);
      res.render('profile', data);
    }
  });
});

// My Files from navbar. Redirects to files for logged in user.
app.get('/my_files', (req, res) => {
  if (!app.get('userId')) {
    res.redirect('/');
    return;
  }
  res.redirect('/files/' + app.get('userId'));
});

// Creates new file with default values and inserts it to database.
app.post('/create_new_file', (req, res) => {
  const timestamp = new Date().toISOString();
  // For final version, have a 'version_history' table to maintain all versions of
  // files.
  client.query(queryCreateNewFile, [app.get('userId'), timestamp], (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      res.redirect('/file/' + results.rows[0].id);
    }
  });
});

// Creating a new user.
app.post('/create_user', async (req, res) => {
  const username = req.body.username2;
  const email = req.body.email2;
  var rows = await db.insertNewUser([username, email]);
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
  const email = req.body.email1;
  var rows = await db.getLoginInfo([username, email]);
  var userId = rows[0].id;
  app.set('userId', userId);
  app.set('username', username);
  console.log('Logged in. User: ' + userId);
  console.log('Username: ' + username);
  res.redirect('/files/' + userId);
});

app.listen(port);
