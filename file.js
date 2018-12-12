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
  data.isFileOwner = await db.checkIsFileOwner([req.app.get('userId'), file_id]);
  data.isCollaborator = await db.checkIsCollaborator([req.app.get('username'), file_id]);
  data.locker = await db.getUserUpdating([file_id]);

  var publicity = rows[0].publicity;
  if (publicity == 'public') {
    data.isPublic = true;
  } else if (publicity == 'restricted') {
    data.isRestricted = true;
  } else if (publicity == 'shared') {
    data.isShared = true;
  } else if (publicity == 'private') {
    data.isPrivate = true;
  }

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
  //if(req.app.get('userType') != "guest"){
    db.addEditor([req.app.get('userId'), req.params.file_id]);
  //}
  res.redirect('back');
});

router.post('/:file_id/unlock', async (req, res) => {
  var rows = await db.getFileInfo([req.params.file_id]);
  var isFileOwner = await db.checkIsFileOwner([req.app.get('userId'), req.params.file_id]);

  if(req.app.get('userId') == rows[0].editor_id){
    db.removeEditor([req.app.get('userId'), req.params.file_id]);
  } else if (isFileOwner) {
    db.removeEditorForced([req.params.file_id]);
  }

  res.redirect('back');
});

router.post('/:file_id/update', async (req, res) => {
  var rows = await db.getFileInfo([req.params.file_id]);
  if(req.app.get('userId') == rows[0].editor_id){
    var newLines = req.body.text.split("\r\n");

    // Get array of taboo words
    var tabooWordsArray = await db.getListTabooWords();
    tabooList = []
    for(i=0; i < tabooWordsArray.length; i++) {
      var row = tabooWordsArray[i];
      tabooList.push(row['taboo_word']);
    }

    // Replace all instances of taboo words with UNK
    for(i=0; i<newLines.length; i++) {
      for(j=0; j<tabooWordsArray.length; j++) {
        if(newLines[i] == tabooList[j]) {
          newLines[i] = 'UNK';
        }
      }
    }

    var bodyText = req.body.text;
    for(i=0; i<tabooList.length; i++) {
      console.log('Changing: ' + tabooList[i]);
      var re = new RegExp(tabooList[i], 'g');
      bodyText = bodyText.replace(re, 'UNK')
      // var resd = bodyText.replace(/${tabooWordsArray[0]}/gi, "UNK");
    }

    if (newLines[newLines.length-1] == ''){
      newLines.pop();
    }
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
    db.updateText([bodyText, req.params.file_id]);
  }
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

async function versionRetrieval(file_id, current_version, current_text, old_version){
    var lines = current_text.split("\r\n");
    if (lines[lines.length-1] == ''){
      lines.pop();
    }
    var retStr = "";
    for(i = current_version-1; i >= old_version; i--){
      console.log('Iteration: ' + i);
      var rows1 = await db.getHistoryFileInfo([file_id, i]);
      console.log(rows1);
      var commands = rows1[0].history_text.split("; ");
      for(j = 0; j < commands.length; j++){
        c = commands[j].split(" ");
        if(c[0] == "update"){
          lines[parseInt(c[1]) - 1] = c.slice(2, c.length).join(" ");
        } else if(c[0] == "delete"){
          lines[parseInt(c[1]) - 1] = "";
        } else{
          lines.push(c[1]);
        }
      }
      lines = lines.filter(function(e){return e});  //removes all "" from lines
    }
    for(i = 0; i < lines.length; i++){
      retStr = retStr + lines[i] + "\r\n";
    }
    return retStr
}

router.post('/:file_id/version', async (req, res) => {
  var rows = await db.getFileInfo([req.params.file_id]);
  var result = await versionRetrieval(req.params.file_id, 3, rows[0].file_text, 0);
  console.log(result);
});
