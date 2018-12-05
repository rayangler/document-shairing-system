/* file.js maintains all routes that have to do with a SPECIFIC file. */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

// Page for the selected file. User can perform corresponding use case functions here.
router.get('/:file_id', async (req, res) => {
  // For future version, include a check for locks and permissions.
  const file_id = req.params.file_id;
  // Query file contents and info here
  var rows = await db.getFileInfo([file_id]);
  var data = rows[0];
  data.file_id = file_id;
  console.log(data);
  res.render('file', data);
})

router.get('/:file_id/manage', async (req, res) => {
  const file_id = req.params.file_id;
  var data = {};
  data.invited_users = await db.getInvitedUsers([file_id]);
  data.valid_users = await db.getValidUsersForInvite([req.app.get('username'), file_id]);
  data.file_id = file_id;
  console.log({data});
  res.render('manage_file', {data});
});

router.post('/:file_id/manage/invite_user', (req, res) => {
  const from_user = req.app.get('username');
  const to_user = req.body.invite_user;
  const file_id = req.params.file_id;
  db.insertNewInvite([from_user, to_user, file_id]);
  res.redirect('back');
});
