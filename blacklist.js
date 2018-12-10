/* taboo.js displays the current list of taboo words. */

const Router = require('express-promise-router');
const router = new Router();
const db = require('./db');

module.exports = router;

router.get('/', async (req, res) => {
  var data = {}
  var rows = await db.getTabooWords();
  data.rows = rows;
  console.log(data);
  res.render('blacklist', {data});
});

router.post('/', (req, res) => {
  const tabooWord = req.body.submit_word;
  const submittedBy = req.app.get('username');
  console.log('New taboo word submitted: ' + tabooWord);
  // need to add conditional for if user = guest, then only a request is sent
  db.insertTabooWord([tabooWord, submittedBy]);
  res.redirect('back');
});
