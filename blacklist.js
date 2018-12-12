/* taboo.js displays the current list of taboo words. */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

router.get('/', async (req, res) => {
  var data = {}
  var rows = await db.getConfirmedTabooWords();
  data.rows = rows;
  var userType = await db.getUserType([req.app.get('username')]);
  if (userType = 'super') {
    data.isSuperUser = true;
  };

  console.log(data);
  res.render('blacklist', {data});
});

router.post('/submit', (req, res) => {
  const tabooWord = req.body.submit_word;
  const submittedBy = req.app.get('username');
  console.log('New taboo word submitted: ' + tabooWord);
  // need to add conditional for if user = guest, then only a request is sent
  db.submitTabooWord([tabooWord, submittedBy]);
  res.redirect('back');
});

router.post('/delete_taboo', (req,res) => {
  const tabooWord = req.body.taboo_word;
  console.log('Taboo word deleted: ' + tabooWord);
  db.removeTabooWord([tabooWord]);
  res.redirect('back');
});
