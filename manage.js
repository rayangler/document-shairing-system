/* manage.js maintains all routes that manage the current users and invites for
   a given file. */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

router.get('/', async (req, res) => {
  const file_id = req.params.file_id;
  var data = {};
  data.invited_users = await db.getInvitedUsers([file_id]);
  data.valid_users = await db.getValidUsersForInvite([req.app.get('username'), file_id]);
  data.file_id = file_id;
  console.log({data});
  console.log(req.baseUrl);
  res.render('manage_file', {data});
});

router.post('/invite_user', (req, res) => {
  const from_user = req.app.get('username');
  const to_user = req.body.invite_user;
  const file_id = req.params.file_id;
  db.insertNewInvite([from_user, to_user, file_id]);
  res.redirect('back');
});
