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
  data.user_type = await db.getUserType([req.app.get('username')]);
  console.log(data);
  res.render('inbox', {data});
});

router.get('/applications', async (req, res) => {
  var data = {};
  data.base_url = '/inbox';
  data.applications = true;
  data.pending_applications = await db.getPendingApplications();
  console.log(data);
  res.render('inbox', {data})
});

router.get('/complaints', async (req, res) => {
  var data = {};
  data.complaints = true;
  data.base_url = req.baseUrl;
  data.user_type = await db.getUserType([req.app.get('username')]);
  data.owner_complaints = await db.getOwnerComplaints([req.app.get('userId')]);
  if (data.user_type == 'super') {
    data.super_user = true;
    data.su_complaints = await db.getSUComplaints([req.app.get('userId')]);
  }
  console.log(data);
  res.render('inbox', {data});
});

router.get('/taboo', async (req, res) => {
  var data = {};
  data.base_url = req.baseUrl;
  data.taboo = true;
  data.taboo_suggestions = await db.getSuggestedTabooWords([]);
  data.user_type = await db.getUserType([req.app.get('username')]);
  console.log(data);
  res.render('inbox', {data});
});

router.post('/accept_invite', (req, res) => {
  db.acceptInvite([req.app.get('username'), req.body.file_id]);
  res.redirect('back');
});

router.post('/decline_invite', (req, res) => {
  db.declineInvite([req.app.get('username'), req.body.file_id]);
  res.redirect('back');
});

router.post('/resolve_complaint', (req, res) => {
  db.resolveComplaint([req.body.complainer_id, req.body.file_id, req.body.subject]);
  res.redirect('back');
});

router.post('/accept_application', (req, res) => {
  db.acceptApplication([req.app.get('username')]);
  console.log(req.app.get('user_type'));
  res.redirect('back');
});

router.post('/decline_application', (req, res) => {
  db.declineApplication([req.app.get('username')]);
});

router.post('/accept_word', (req, res) => {
  db.acceptTabooWord([req.body.tabooWord]);
  console.log(req.body.tabooWord);
  res.redirect('back');
});

router.post('/decline_word', (req, res) => {
  db.removeTabooWord([req.body.tabooWord]);
  res.redirect('back');
});
