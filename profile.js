/* profile.js maintains the routing for user profiles. */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

// Profile from navbar. Redirects to logged in user's profile page.
router.get('/', (req, res) => {
  if (!req.app.get('userId')) {
    res.redirect('/');
    return;
  }
  res.redirect(req.baseUrl + '/'+ req.app.get('userId'));
});

// Profile creation page for new users.
router.get('/submit_application', (req, res) => {
  var username = req.app.get('username')
  res.render('application', {username});
});

// Profile page for user with id in params.
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  var rows = await db.getProfilePage([id]);
  var userType = await db.getUserType([req.app.get('username')]);
  var data = {}
  data.rows = rows[0]
  if (userType == 'guest') {
    data.isGuestUser = true;
  };
  data.interests = await db.getUserInterests([id]);
  if (id == req.app.get('userId')) {
    data.isTheirProfile = true;
  }
  data.user_id = id;
  data.valid_interests = await db.getValidInterests([req.app.get('userId')]);
  console.log(data);
  res.render('profile', {data});
});

router.post('/submit_application', (req, res) => {
  const userId = req.app.get('userId');
  const username = req.body.username;
  const pictureUrl = req.body.picture_url;
  const technicalInterests = req.body.technical_interests;
  db.insertNewApplication([username, pictureUrl, technicalInterests]);
  console.log('Application submitted for: ' + username);
  res.redirect(req.baseUrl + '/'+ req.app.get('userId'));
});

router.post('/:id/delete_interest', (req, res) => {
  db.deleteUserInterest([req.params.id, req.body.interest_id]);
  res.redirect('back');
});

router.post('/:id/add_interest', (req, res) => {
  db.addUserInterest([req.params.id, req.body.add_interest]);
  res.redirect('back');
});
