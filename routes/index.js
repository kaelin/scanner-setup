var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.setHeader("Pragma", "no-cache");
  res.render('index', { title: 'Brother Scanner Setup', ip: ip });
});

module.exports = router;
