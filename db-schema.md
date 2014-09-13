db-schema
=========

Since **redis** clients have to refer to their database by number, **scanner-setup** adopts the convention of storing
its number in database 0 (the default database). It does so like this:

    hmset db:scanner-setup select <DB> creation-date "<DATE>" schema-version 1

The first thing the app does, when the connection to **redis** is ready, is:

    hget db:scanner-setup select
    => <DB>
    select <DB>

config
======

`config:baseurl` -- HTTP URL used to access the Brother printer on the local network.

    127.0.0.1:6379[1]> get config:baseurl
    "http://brw342387ae07f5.local."


cache
=====

`brother-profile:[0-9]` -- Cached metadata for the profiles (from the Brother printer's admin interface).

    127.0.0.1:6379[1]> hgetall brother-profile:0
    1) "href"
    2) "http://brw342387ae07f5.local./scan/profile_ftp.html?val=1&pageid=84"
    3) "assignable"
    4) "true"
    5) "name"
    6) "laguvadrasana"
