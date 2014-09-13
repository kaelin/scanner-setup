define(DB, 1)dnl
define(DATE, translit(esyscmd('date'), '
'))dnl
hmset db:scanner-setup select DB creation-date "DATE" schema-version 1
hgetall db:scanner-setup
select DB
flushdb
set config:baseurl http://brw342387ae07f5.local.
