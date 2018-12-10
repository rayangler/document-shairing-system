const { Client } = require('pg');
const Router = require('express-promise-router');
const router = new Router();

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
  created_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  publicity VARCHAR(255) DEFAULT 'public'
);`;
// Invites Table. A table for the invites between users to files.
const createInvitesTable = `
CREATE TABLE IF NOT EXISTS invites(
  from_user VARCHAR(255) REFERENCES users(username),
  to_user VARCHAR(255) REFERENCES users(username),
  file_id INTEGER REFERENCES files(id),
  invited_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(255) DEFAULT 'pending'
);`;
// Collaborators Table. A table for users who have accepted their invites to edit files.
const createCollaboratorsTable = `
CREATE TABLE IF NOT EXISTS collaborators(
  username VARCHAR(255) REFERENCES users(username),
  file_id INTEGER REFERENCES files(id)
);`
// Blacklist Table. A table for blacklisted users for each file.
const createBlacklistTable = `
CREATE TABLE IF NOT EXISTS blacklist(
  user_id INTEGER REFERENCES users(id),
  file_id INTEGER REFERENCES files(id)
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
client.query(createInvitesTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createCollaboratorsTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createBlacklistTable, (err, res) => {
  if (err) console.log(err.stack);
});

// Inserts
const queryInsertUser = `INSERT INTO users(username, email)
VALUES($1, $2) RETURNING id`;
const queryInsertProfile = `INSERT INTO profiles(user_id, name, picture_url, bio)
VALUES($1, $2, $3, $4)`;
const queryCreateNewFile = `INSERT INTO files(user_id)
VALUES ($1) RETURNING id`;
const queryBlacklistUser = `
INSERT INTO blacklist(user_id, file_id)
SELECT users.id, $1 FROM users
WHERE username = $2;`
const queryInviteUser = `INSERT INTO invites(from_user, to_user, file_id)
VALUES($1, $2, $3)`;

// Selects
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
const queryInviteValidUsers = `
SELECT username FROM users
WHERE username != $1 AND NOT EXISTS
(SELECT 1 FROM invites
  WHERE to_user = username AND file_id = $2)
AND NOT EXISTS
(SELECT 1 FROM collaborators
  WHERE collaborators.username = users.username AND file_id = $2)
AND NOT EXISTS
(SELECT 1 FROM blacklist
  WHERE blacklist.user_id = users.id AND file_id = $2)
ORDER BY username ASC;`;
const queryInvitedUsers = `
SELECT * FROM invites
WHERE file_id = $1 AND status = 'pending'
ORDER BY to_user ASC;`;
const queryFilePublicity = `
SELECT publicity FROM files
WHERE id = $1;`;
const queryCollaborators = `
SELECT username FROM collaborators
WHERE file_id = $1;`;
const queryNonBlacklisted = `
SELECT username FROM users
WHERE id != $1 AND NOT EXISTS
  (SELECT 1 FROM blacklist
    JOIN users AS u ON users.id = blacklist.user_id
    WHERE u.username = username AND blacklist.file_id = $2);`;
const queryBlacklisted = `
SELECT username FROM users
JOIN blacklist ON users.id = blacklist.user_id
WHERE file_id = $1;`;

// Updates
const queryUpdatePublicity = `
UPDATE files
SET publicity = $1
WHERE id = $2;`;

// Deletion
const queryRemoveCollaborator = `
DELETE FROM collaborators
WHERE username = $1 AND file_id = $2;`;
const queryCancelInvite = `
DELETE FROM invites
WHERE to_user = $1 AND file_id = $2;`;
const queryRemoveBlacklisted = `
DELETE FROM blacklist
WHERE file_id = $1 AND user_id =
  (SELECT id FROM users WHERE username = $2);`

async function getInfo(query, params) {
  var results = await client.query(query, params);
  return results.rows;
}

// Returning is true you need the insert query to return a value from the table.
async function insertInfo(query, params, returning=false) {
  var results = await client.query(query, params);
  if (returning) {
    return results.rows;
  }
}

module.exports = {
  insertNewProfile: (params) => {
    insertInfo(queryInsertProfile, params);
  },
  insertNewUser: (params) => {
    return insertInfo(queryInsertUser, params, true);
  },
  insertNewFile: (params) => {
    return insertInfo(queryCreateNewFile, params, true);
  },
  insertBlacklistedUser: (params) => {
    return insertInfo(queryBlacklistUser, params);
  },
  insertNewInvite: (params) => {
    return insertInfo(queryInviteUser, params);
  },
  getLoginInfo: (params) => {
    return getInfo(queryLoginUser, params);
  },
  getProfilePage: (params) => {
    return getInfo(queryProfilePage, params);
  },
  getUserFiles: (params) => {
    return getInfo(queryUserFiles, params);
  },
  getFileInfo: (params) => {
    return getInfo(queryFileInfo, params);
  },
  getFilePublicity: async (params) => {
    var rows = await getInfo(queryFilePublicity, params);
    return rows[0].publicity;
  },
  getCollaborators: (params) => {
    return getInfo(queryCollaborators, params);
  },
  getNonBlacklistedUsers: (params) => {
    return getInfo(queryNonBlacklisted, params);
  },
  getBlacklistedUsers: (params) => {
    return getInfo(queryBlacklisted, params);
  },
  getInvitedUsers: (params) => {
    return getInfo(queryInvitedUsers, params);
  },
  getValidUsersForInvite: (params) => {
    return getInfo(queryInviteValidUsers, params);
  },
  cancelInvite: (params) => {
    return client.query(queryCancelInvite, params);
  },
  updatePublicity: (params) => {
    return client.query(queryUpdatePublicity, params);
  },
  removeCollaborator: (params) => {
    return client.query(queryRemoveCollaborator, params);
  },
  removeBlacklistedUser: (params) => {
    return client.query(queryRemoveBlacklisted, params);
  }
}
