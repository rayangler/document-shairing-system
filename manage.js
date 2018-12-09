/* manage.js maintains all routes that manage the current users and invites for
   a given file. */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

router.get('/', async (req, res) => {
  res.redirect(req.baseUrl + '/users');
});

router.get('/users', async (req, res) => {
  const file_id = req.file_id;
  var data = {};
  data.users = true;
  data.file_id = file_id;
  console.log({data});
  console.log(req.baseUrl);
  res.render('manage_file', {data});
});

router.get('/invites', async (req, res) => {
  const file_id = req.file_id;
  var data = {};
  data.invited_users = await db.getInvitedUsers([file_id]);
  data.valid_users = await db.getValidUsersForInvite([req.app.get('username'), file_id]);
  data.invites = true;
  data.file_id = file_id;
  console.log({data});
  console.log(req.baseUrl);
  res.render('manage_file', {data});
});

router.post('/invite_user', (req, res) => {
  const from_user = req.app.get('username');
  const to_user = req.body.invite_user;
  const file_id = req.file_id;
  db.insertNewInvite([from_user, to_user, file_id]);
  res.redirect('back');
});

router.post('/cancel_invite', (req, res) => {
  const to_user = req.body.to_user;
  const from_user = req.body.from_user;
  const file_id = req.file_id;
  db.cancelInvite([to_user, from_user, file_id]);
  res.redirect('back');
});
