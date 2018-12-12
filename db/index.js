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
  file_text TEXT DEFAULT '',
  current_version INTEGER DEFAULT 0,
  created_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  editor_id INTEGER REFERENCES users(id) DEFAULT NULL,
  publicity VARCHAR(255) DEFAULT 'public'
);`;
// History Files Table. A table for the history files of each file.
const createHistoryFilesTable = `
CREATE TABLE IF NOT EXISTS history_files(
  id INTEGER REFERENCES files(id),
  version INTEGER,
  history_text TEXT
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
// Membership Applications Table. A table for pending applications from guest users.
const createApplicationsTable = `
CREATE TABLE IF NOT EXISTS membershipApplications(
  username VARCHAR(255) REFERENCES users(username) UNIQUE,
  picture_url TEXT DEFAULT 'https://t3.ftcdn.net/jpg/00/64/67/52/240_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg',
  technical_interests TEXT,
  status VARCHAR(255) DEFAULT 'pending'
);`;
// Taboo Blacklist Table. A table for the list of taboo words in the system.
const createTabooTable = `
CREATE TABLE IF NOT EXISTS tabooBlacklist(
  taboo_word VARCHAR(255) NOT NULL UNIQUE,
  CHECK (taboo_word <> ''),
  submitted_by VARCHAR(255) REFERENCES users(username),
  status VARCHAR(255) DEFAULT 'pending'
);`;
// Collaborators Table. A table for users who have accepted their invites to edit files.
const createCollaboratorsTable = `
CREATE TABLE IF NOT EXISTS collaborators(
  username VARCHAR(255) REFERENCES users(username),
  file_id INTEGER REFERENCES files(id)
);`
// Blacklist Users Table. A table for blacklisted users for each file.
const createUsersBlacklistTable = `
CREATE TABLE IF NOT EXISTS users_blacklist(
  user_id INTEGER REFERENCES users(id),
  file_id INTEGER REFERENCES files(id)
);`;
// Complaints Table. A table for complaints, sent to document owners or SUs.
const createComplaintsTable = `
CREATE TABLE IF NOT EXISTS complaints(
  complainer_id INTEGER REFERENCES users(id),
  file_id INTEGER REFERENCES files(id),
  recipient VARCHAR(255),
  subject TEXT,
  complaint_text TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`
// Interests Table. A table for interests built into the system.
const createInterestsTable = `
CREATE TABLE IF NOT EXISTS interests(
  interest_id SERIAL PRIMARY KEY,
  interest_name VARCHAR(255) UNIQUE
);`
// User Interests Table. A table keeping track of all users' interests.
const createUserInterestsTable = `
CREATE TABLE IF NOT EXISTS user_interests(
  user_id INTEGER REFERENCES users(id),
  interest_id INTEGER REFERENCES interests(interest_id)
);`

client.query(createUsersTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createProfilesTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createFilesTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createHistoryFilesTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createInvitesTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createApplicationsTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createTabooTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createCollaboratorsTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createUsersBlacklistTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createComplaintsTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createInterestsTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createUserInterestsTable, (err, res) => {
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
INSERT INTO users_blacklist(user_id, file_id)
SELECT users.id, $1 FROM users
WHERE username = $2`;
const queryInviteUser = `INSERT INTO invites(from_user, to_user, file_id)
VALUES($1, $2, $3)`;
const querySubmitTabooWord = `INSERT INTO tabooBlacklist(taboo_word, submitted_by)
VALUES($1, $2)`;
const queryAddCollaborator = `INSERT INTO collaborators VALUES ($1, $2)`;
const queryAddHistoryFile = `INSERT INTO history_files(id, version, history_text)
VALUES($1, $2, $3)`;
const queryInsertComplaint = `
INSERT INTO complaints(complainer_id, file_id, recipient, subject, complaint_text)
VALUES ($1, $2, $3, $4, $5)`;
const querySubmitApplication = `INSERT INTO membershipApplications(username, picture_url, technical_interests)
VALUES($1, $2, $3)`;
// Interests directly added to the Interests Table.
const queryInsertInterest = `
INSERT INTO interests(interest_name)
VALUES ($1)
ON CONFLICT (interest_name)
DO NOTHING;`
const queryInsertUserInterest = `
INSERT INTO user_interests(user_id, interest_id)
SELECT $1, interest_id FROM interests
WHERE interests.interest_name = $2;`;

// Inserts 15 chosen interests:
function insertInterests() {
  const interests = [
    'Algorithms',
    'Big Data',
    'Data Mining',
    'Databases',
    'Statistical Analysis',
    'Coding',
    'Debugging',
    'Network Security',
    'Operating Systems',
    'Testing',
    'Blogging',
    'Web Analytics'
  ]
  var length = interests.length;
  for (var i = 0; i < length; i++) {
    client.query(queryInsertInterest, [interests[i]]);
  }
}
insertInterests();

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
const queryHistoryFileInfo = `
SELECT * FROM history_files
JOIN files ON history_files.id = files.id
WHERE history_files.id = $1;`;
const queryInviteValidUsers = `
SELECT username FROM users
WHERE username != $1 AND NOT EXISTS
(SELECT 1 FROM invites
  WHERE to_user = username AND file_id = $2)
AND NOT EXISTS
(SELECT 1 FROM collaborators
  WHERE collaborators.username = users.username AND file_id = $2)
AND NOT EXISTS
(SELECT 1 FROM users_blacklist
  WHERE users_blacklist.user_id = users.id AND file_id = $2)
ORDER BY username ASC;`;
const queryPendingInvites = `
SELECT from_user, file_id, file_name, invited_on FROM invites
JOIN files ON invites.file_id = files.id
WHERE invites.to_user = $1;`;
const queryInvitedUsers = `
SELECT * FROM invites
WHERE file_id = $1 AND status = 'pending'
ORDER BY to_user ASC;`;
const querySuggestedTabooWords = `
SELECT * FROM tabooBlacklist
WHERE status = 'pending'
ORDER BY taboo_word ASC;`;
const queryConfirmedTabooWords = `
SELECT * FROM tabooBlacklist
WHERE status = 'confirmed'
ORDER BY taboo_word ASC;`;
const queryFilePublicity = `
SELECT publicity FROM files
WHERE id = $1;`;
const queryCollaborators = `
SELECT username FROM collaborators
WHERE file_id = $1;`;
const queryNonBlacklistedUsers = `
SELECT username FROM users
WHERE id != $1 AND NOT EXISTS
  (SELECT 1 FROM users_blacklist
    JOIN users AS u ON users.id = users_blacklist.user_id
    WHERE u.username = username AND users_blacklist.file_id = $2);`;
const queryBlacklistedUsers = `
SELECT username FROM users
JOIN users_blacklist ON users.id = users_blacklist.user_id
WHERE file_id = $1;`;
const queryOwnerComplaints = `
SELECT subject, users.username AS complainer, file_name, complaints.timestamp,
  complaint_text, complaints.file_id, complaints.complainer_id FROM complaints
JOIN files ON files.id = complaints.file_id
JOIN users ON complainer_id = users.id
WHERE files.user_id = $1 AND recipient != 'superusers'
ORDER BY complaints.timestamp DESC;`;
const querySUComplaints = `
SELECT subject, users.username AS complainer, file_name, complaints.timestamp,
  complaint_text, complaints.file_id, complaints.complainer_id FROM complaints
JOIN files ON files.id = complaints.file_id
JOIN users ON complainer_id = users.id
WHERE files.user_id = $1 AND recipient = 'superusers'
ORDER BY complaints.timestamp DESC;`;
const queryPendingApplications = `
SELECT username, picture_url, technical_interests FROM membershipApplications;`;
const queryUserType = `
SELECT user_type from users
WHERE username = $1;`;
const queryInterestsToChoose = `
SELECT * FROM interests
WHERE NOT EXISTS
(SELECT 1 FROM user_interests
  WHERE user_id = $1 AND user_interests.interest_id = interests.interest_id);`;
// Gets user interests for a single user
const querySpecificUsersInterests = `
SELECT interest_name, interest_id FROM interests
NATURAL JOIN user_interests
WHERE user_id = $1;`

// Updates
const queryUpdatePublicity = `
UPDATE files
SET publicity = $1
WHERE id = $2;`;
const queryAddEditor = `
UPDATE files
SET editor_id = $1
WHERE id = $2 AND editor_id IS NULL;`;
const queryRemoveEditor = `
UPDATE files
SET editor_id = NULL
WHERE id = $2 AND editor_id = $1;`;
const queryUpdateText = `
UPDATE files
SET file_text = $1,
    current_version = current_version + 1
WHERE id = $2;`;
const queryUpdateMembership = `
UPDATE users
SET user_type = 'ordinary'
WHERE username = $1;`;
const queryAcceptTabooWord = `
UPDATE tabooBlacklist
SET status = 'confirmed'
WHERE taboo_word = $1;`;

// Deletion
const queryRemoveCollaborator = `
DELETE FROM collaborators
WHERE username = $1 AND file_id = $2;`;
const queryCancelInvite = `
DELETE FROM invites
WHERE to_user = $1 AND file_id = $2;`;
const queryRemoveBlacklistedUser = `
DELETE FROM users_blacklist
WHERE file_id = $1 AND user_id =
(SELECT id FROM users WHERE username = $2);`;
const queryDeleteApplication = `
DELETE FROM membershipApplications
WHERE username = $1;`;
const queryRemoveTabooWord = `
DELETE FROM tabooBlacklist
WHERE taboo_word = $1;`;
const queryResolveComplaint = `
DELETE FROM complaints
WHERE complainer_id = $1 AND file_id = $2 AND subject = $3;`;
const queryDeleteUserInterest = `
DELETE FROM user_interests
WHERE user_id = $1 AND interest_id = $2;`;

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
  addHistoryFile: (params) => {
    return insertInfo(queryAddHistoryFile, params);
  },
  insertTabooWord: (params) => {
    return insertInfo(querySubmitTabooWord, params);
  },
  insertNewApplication: (params) => {
    return insertInfo(querySubmitApplication, params);
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
  getHistoryFileInfo: (params) => {
    return getInfo(queryHistoryFileInfo, params);
  },
  getCollaborators: (params) => {
    return getInfo(queryCollaborators, params);
  },
  getNonBlacklistedUsers: (params) => {
    return getInfo(queryNonBlacklistedUsers, params);
  },
  getBlacklistedUsers: (params) => {
    return getInfo(queryBlacklistedUsers, params);
  },
  getInvitedUsers: (params) => {
    return getInfo(queryInvitedUsers, params);
  },
  getPendingInvites: (params) => {
    return getInfo(queryPendingInvites, params);
  },
  getValidUsersForInvite: (params) => {
    return getInfo(queryInviteValidUsers, params);
  },
  getSuggestedTabooWords: (params) => {
    return getInfo(querySuggestedTabooWords, params);
  },
  getConfirmedTabooWords: (params) => {
    return getInfo(queryConfirmedTabooWords, params);
  },
  getPendingApplications: (params) => {
    return getInfo(queryPendingApplications, params);
  },
  getUserType: async (params) => {
    var rows = await getInfo(queryUserType, params);
    return rows[0].user_type;
  },
  cancelInvite: (params) => {
    return client.query(queryCancelInvite, params);
  },
  acceptInvite: (params) => {
    client.query(queryCancelInvite, params); // Delete invite from invites table
    return client.query(queryAddCollaborator, params);
  },
  acceptApplication: (params) => {
    client.query(queryDeleteApplication, params);
    return client.query(queryUpdateMembership, params);
  },
  acceptTabooWord: (params) => {
    return client.query(queryAcceptTabooWord, params);
  },
  declineInvite: (params) => {
    return client.query(queryCancelInvite, params);
  },
  declineApplication: (params) => {
    return client.query(queryDeleteApplication, params);
  },
  updatePublicity: (params) => {
    return client.query(queryUpdatePublicity, params);
  },
  removeCollaborator: (params) => {
    return client.query(queryRemoveCollaborator, params);
  },
  removeBlacklistedUser: (params) => {
    return client.query(queryRemoveBlacklistedUser, params);
  },
  addEditor: (params) => {
    return client.query(queryAddEditor, params);
  },
  removeEditor: (params) => {
    return client.query(queryRemoveEditor, params);
  },
  updateText: (params) => {
    return client.query(queryUpdateText, params);
  },
  submitNewComplaint: (params) => {
    return insertInfo(queryInsertComplaint, params);
  },
  getOwnerComplaints: (params) => {
    return getInfo(queryOwnerComplaints, params);
  },
  getSUComplaints: (params) => {
    return getInfo(querySUComplaints, params);
  },
  submitTabooWord: (params) => {
    return insertInfo(querySubmitTabooWord, params);
  },
  removeTabooWord: (params) => {
    return client.query(queryRemoveTabooWord, params);
  },
  resolveComplaint: (params) => {
    return client.query(queryResolveComplaint, params);
  },
  addUserInterest: (params) => {
    return insertInfo(queryInsertUserInterest, params);
  },
  getUserInterests: (params) => {
    return getInfo(querySpecificUsersInterests, params);
  },
  deleteUserInterest: (params) => {
    return client.query(queryDeleteUserInterest, params);
  },
  getValidInterests: (params) => {
    return getInfo(queryInterestsToChoose, params);
  }
}
