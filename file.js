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
  req.app.set('file_id', file_id);
  file_text = data.file_text;
  //console.log(data);
  res.render('file', data);
})

router.use('/:file_id/manage', (req, res, next) => {
  req.file_id = req.params.file_id;
  next();
}, require('./manage'));

router.post('/:file_id/lock', (req, res) => {
  db.addEditor([req.app.get('userId'), req.params.file_id]);
  res.redirect('back');
});

router.post('/:file_id/unlock', (req, res) => {
  db.removeEditor([req.app.get('userId'), req.params.file_id]);
  res.redirect('back');
});

router.post('/:file_id/update', (req, res) =>{
  var newLines = req.body.text.split("\r\n");
  if (newLines[newLines.length-1] == ''){
    newLines.pop();
  }

  console.log(lines);
  db.updateText([req.body.text, req.params.file_id]);
  res.redirect('back');
});
