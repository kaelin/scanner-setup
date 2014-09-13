var debug = require('debug')('scanner-setup');
var express = require('express');
var router = express.Router();

var baseurl = 'http://example.com';
var cheerio = require('cheerio');
var http = require('http');
var redis = require('redis');

// Keep a redis connection for caching profile data
var cache = redis.createClient();
cache.on('ready', function() {
  debug('Connection to redis is ready');
  cache.hget('db:scanner-setup', 'select', function(err, DB) {
    debug('Select redis db ' + DB);
    cache.select(DB);
    cache.get('config:baseurl', function(err, url) {
      debug('My config:baseurl is <' + url + '>');
      baseurl = url;
    });
  });
});

// TODO: Use the request module instead of this fetch function…

function fetch(url, callback) {
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}

/* GET profiles listing. */
router.get('/', function(req, res) {
  var path = '/scan/scanprofile.html';
  debug('Fetching profiles from <' + baseurl + path + '> ...');
  fetch(baseurl + path, function(data) {
    var reply = { error: 'Error fetching profiles from <' + baseurl + path + '>' };
    if (data) {
      var profiles = [];
      var $ = cheerio.load(data);
      $('table.contents > tr.under > th').each(function(i, elt) {
        var definition = elt.next.children[0].children[0];
        if (definition) {
          definition = { name: definition.data, assignable: true };
        }
        else {
          definition = { name: '', assignable: false };
        }
        definition['href'] = baseurl + elt.next.children[0].attribs['href'];
        profiles.push(definition);
        cache.hmset('brother-profile:' + i, definition);
      });
      reply = profiles;
    }
    res.send(reply);
    debug('Fetch completed')
  });
});

module.exports = router;
