const port = 3000;
const express = require('express');
const path = require('path');
const hb = require('express-handlebars');
const { Client } = require('pg');
const app = express();

app.engine('handlebars', hb({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, '/public'))); // Used to access css file(s)

/* Global app variables:
 * userId: Currently logged on user.
 */

const connectionString = 'postgresql://air_superuser:password@localhost/air_db'
const client = new Client({
  connectionString: connectionString,
});

client.connect((err) => {
  if (err) {
    console.log('Connection error', err.stack);
  } else {
    console.log('Connected to database');
  }
});

// Create tables
// Users Table.
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  user_type VARCHAR(255) DEFAULT 'guest'
);`;
// Profiles Table. Profiles are linked to users and contain most of the
// information for each profile.
const createProfilesTable = `
CREATE TABLE IF NOT EXISTS profiles(
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  picture_url TEXT,
  bio TEXT
);`;
// Files Table. A table for the files of each user.
const createFilesTable = `
CREATE TABLE IF NOT EXISTS files(
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  file_name TEXT DEFAULT 'Untitled_File',
  current_version TEXT DEFAULT '1',
  created_on TIMESTAMPTZ
);`;

client.query(createUsersTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createProfilesTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createFilesTable, (err, res) => {
  if (err) console.log(err.stack);
});

// Queries
const queryInsertUser = `INSERT INTO users(username, email)
VALUES($1, $2) RETURNING id`;
const queryInsertProfile = `INSERT INTO profiles(user_id, name, picture_url, bio)
VALUES($1, $2, $3, $4)`;
const queryCreateNewFile = `INSERT INTO files(user_id, created_on)
VALUES ($1, $2) RETURNING id`;
const queryLoginUser = `
SELECT * FROM users
WHERE username = $1 AND email = $2;`;
const queryProfilePage = `
SELECT * FROM users
JOIN profiles ON profiles.user_id = users.id
WHERE id = $1;`;
const queryUserFiles = `
SELECT profiles.name, file_name, current_version, created_on FROM users
JOIN profiles ON users.id = profiles.user_id
LEFT JOIN files ON users.id = files.user_id
WHERE users.id = $1
ORDER BY created_on DESC;`;
const queryFileInfo = `
SELECT * FROM files
JOIN users ON files.user_id = users.id
JOIN profiles ON files.user_id = profiles.user_id
WHERE files.id = $1;`;
const querySearchFiles = `
SELECT profiles.name, file_name, current_version, created_on FROM users
JOIN profiles ON users.id = profiles.user_id
LEFT JOIN files ON users.id = files.user_id
WHERE users.id = $1 AND files.file_name ILIKE '%' || $2 || '%'
ORDER BY created_on DESC;`;

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

// Routing
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

// Shows a list of files for the user with the given id in params.
app.get('/files/:id', (req, res) => {
  if (!app.get('userId')) {
    res.redirect('/');
    return;
  }
  const id = req.params.id;
  client.query(queryUserFiles, [id], (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      loadFilesPage(res, results);
    }
  });
});

// Similar to /files/:id but with the search feature in use.
app.post('/files/:id/search', (req, res) => {
  const user_id = req.params.id;
  const search_info = req.body.search_info;
  console.log('Searching for: ' + search_info);
  // Need to update query so that it can handle if the searched keyword is not present.
  client.query(querySearchFiles, [user_id, search_info], (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      loadFilesPage(res, results);
    }
  });
});

// Page for the selected file. User can perform corresponding use case functions here.
app.get('/file/:file_id', (req, res) => {
  // For future version, include a check for locks and permissions.
  const file_id = req.params.file_id;
  // Query file contents and info here
  client.query(queryFileInfo, [file_id], (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      var data = results.rows[0];
      console.log(data);
      res.render('file', data);
    }
  });
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
app.post('/create_user', (req, res) => {
  const username = req.body.username2;
  const email = req.body.email2;
  client.query(queryInsertUser, [username, email], (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      var userId = results.rows[0].id;
      app.set('userId', userId); // App sets logged-in user to the new user.
      console.log('New user created. User Id: ' + userId);
      res.redirect('/create_profile');
    }
  });
});

// Creates a new profile for the new user.
app.post('/create_profile', (req, res) => {
  const userId = app.get('userId');
  const name = req.body.name;
  const picture_url = req.body.picture_url;
  const bio = req.body.bio;
  client.query(queryInsertProfile, [userId, name, picture_url, bio], (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      console.log('New profile created for user: ' + userId);
      res.redirect('/profile/' + userId);
    }
  });
});

// Logs in the user if their username and email exist within the database.
// Password is ommitted for demonstration and due to lack of security.
app.post('/login_user', (req, res) => {
  const username = req.body.username1;
  const email = req.body.email1;
  client.query(queryLoginUser, [username, email], (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      var userId = results.rows[0].id;
      app.set('userId', userId);
      console.log('Logged in. User: ' + userId);
      res.redirect('/files/' + userId);
    }
  });
});

app.listen(port);
