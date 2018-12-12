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
});


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

router.post('/:file_id/update', async (req, res) => {
  var newLines = req.body.text.split("\r\n");
  if (newLines[newLines.length-1] == ''){
    newLines.pop();
  }
  var rows = await db.getFileInfo([req.params.file_id]);
  var oldLines = rows[0].file_text.split("\r\n");
  if (oldLines[oldLines.length-1] == ''){
    oldLines.pop();
  }
  var retStr = "";
  var index = 0;
  if(oldLines.length == newLines.length){
		for(i = 0; i < newLines.length; i++){
			if(newLines[i] != oldLines[i]){
				retStr = retStr + "update " + (i+1) + " " + oldLines[i] + "; ";
			}
		}
  } else{
      for(i = 0; i < newLines.length; i++){
        if(oldLines[index] != newLines[i]){
          retStr = retStr + "delete " + (i+1) + "; "
        } else{
          index++;
        }
      }
      for(i = index; i < oldLines.length; i++){
        retStr = retStr + "add " + oldLines[i] + "; "
      }
    }
  retStr = retStr.substring(0, retStr.length - 2);

  var version = rows[0].current_version;
  db.addHistoryFile([req.params.file_id, version, retStr]);
  db.updateText([req.body.text, req.params.file_id]);
  res.redirect('back');
});

router.get('/:file_id/complaint', (req, res) => {
  var data = {};
  data.file_id = req.params.file_id;
  res.render('new_complaint', data);
});

router.post('/:file_id/complaint', (req, res) => {
  db.submitNewComplaint([
    req.app.get('userId'),
    req.params.file_id,
    req.body.recipient,
    req.body.complaint_subject,
    req.body.complaint_text
  ]);
  res.redirect('back');
});
