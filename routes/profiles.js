var debug = require('debug')('scanner-setup');
var express = require('express');
var router = express.Router();

var baseurl = 'http://example.com';
var cheerio = require('cheerio');
var http = require('http');
var redis = require('redis');
var request = require('request');

// Keep a redis connection for caching profile data
var cache = redis.createClient();
cache.on('ready', function() {
  debug('Connection to redis is ready [cache]');
  cache.hget('db:scanner-setup', 'select', function(err, DB) {
    if (err) throw err;
    debug('Select redis db ' + DB);
    cache.select(DB);
    cache.get('config:baseurl', function(err, url) {
      if (err) throw err;
      debug('My config:baseurl is <' + url + '>');
      baseurl = url;
    });
  });
});

// Keep a second redis connection for receiving pub-sub messages
var actor = redis.createClient();
actor.on('ready', function() {
  debug('Connection to redis is ready [actor]');
  actor.on('subscribe', function(topic, count) {
    debug('Subscribed to ' + topic + ' (count = ' + count + ')');
  });
  actor.on('message', function(topic, msg) {
    debug('Received ' + topic + ' ' + msg);
    switch (topic) {
      case 'scanner-setup.profiles':
        fetchProfile(msg);
        break;
    }
  });
  actor.subscribe('scanner-setup.profiles');
});

function fetchProfile(msg) {
  cache.hget(msg, 'href', function(err, href) {
    if (err) throw err;
    debug(href);
  });
}

function sendReply(res, reply) {
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.setHeader("Pragma", "no-cache");
  res.send(reply);
}

/* GET profiles listing. */
router.get('/', function(req, res) {
  cache.get('brother-profiles', function(err, data) {
    var profiles = [];
    if (data) {
      debug('Using cached profiles: ' + data);
      profiles = JSON.parse(data);
      sendReply(res, profiles);
      return;
    }
    var path = '/scan/scanprofile.html';
    debug('Fetching profiles from <' + baseurl + path + '> ...');
    request(baseurl + path, function(err, response, data) {
      var reply = { error: 'Error fetching profiles from <' + baseurl + path + '>' };
      if (!err && response.statusCode == 200) {
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
          cache.publish('scanner-setup.profiles', 'brother-profile:' + i);
        });
        cache.setex('brother-profiles', 300, JSON.stringify(profiles));
        reply = profiles;
      }
      sendReply(res, reply);
      debug('Fetch completed')
    });
  });
});

module.exports = router;
