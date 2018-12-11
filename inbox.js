/* inbox.js maintains all routes that have to do with interacting with
   notifications such as invitations */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

router.get('/', (req, res) => {
  if (!req.app.get('userId')) {
    res.redirect('/');
    return;
  }
  res.redirect(req.baseUrl + '/invites');
});

router.get('/invites', async (req, res) => {
  var data = {};
  data.base_url = req.baseUrl;
  data.invites = true;
  data.pending_invites = await db.getPendingInvites([req.app.get('username')])
  console.log(data);
  res.render('inbox', {data});
});

router.get('/applications', async (req, res) => {
  var data = {};
  data.base_url = '/inbox';
  data.applications = true;
  data.pending_applications = await db.getPendingApplications()
  console.log(data);
  res.render('inbox', {data})
});

router.post('/accept_invite', (req, res) => {
  db.acceptInvite([req.app.get('username'), req.body.file_id]);
  res.redirect('back');
});

router.post('/decline_invite', (req, res) => {
  db.declineInvite([req.app.get('username'), req.body.file_id]);
  res.redirect('back');
});

router.post('/accept_application', (req, res) => {
  db.acceptApplication([req.app.get('username')]);
  console.log(req.app.get('user_type'));
  res.redirect('back');
});

router.post('/decline_application', (req, res) => {
  db.declineApplication([req.app.get('username')]);
  res.redirect('back');
});
