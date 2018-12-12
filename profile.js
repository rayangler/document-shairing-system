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
})
