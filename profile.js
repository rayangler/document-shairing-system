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

// Profile page for user with id in params.
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  var rows = await db.getProfilePage([id]);
  res.render('profile', rows[0]);
});
