/* files.js maintains all routes that have to do with the files page, which
   shows all of the files for a certain user. */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

// My Files from navbar. Redirects to files for logged in user.
router.get('/', (req, res) => {
  if (!req.app.get('userId')) {
    res.redirect('/');
    return;
  }
  res.redirect(req.baseUrl + '/' + req.app.get('userId'));
});

// Goes to a page of all of the user's files, based on user id in the route.
router.get('/:user_id', async (req, res) => {
  if(!req.app.get('userId')) {
    console.log('Not logged in.');
    console.log(req);
    res.redirect('/');
    return;
  }
  const user_id = req.params.user_id;
  var data = {}
  var rows = await db.getUserFiles([user_id]);
  data.rows = rows;
  data.name = rows[0].name;
  data.user_id = user_id;
  console.log(data);
  res.render('files', {data});
});

// Need to reimplement search feature
