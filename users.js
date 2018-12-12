/* users.js maintains all routes that have to do with showing a list of users */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

// Should show all users on the system.
router.get('/', async (req, res) => {
  var data = {};
  data.users_list = await db.getUsersList(['','']);
  res.render('users', {data});
});

router.post('/search', async (req, res) => {
  var data = {};
  data.users_list = await db.getUsersList([req.body.name, req.body.interests]);
  res.render('users', {data});
});
