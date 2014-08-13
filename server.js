'use strict';

let serve = require('koa-static');
let koa   = require('koa');
let app   = koa();

const PORT = 3000;

app.use(serve('demo'));
app.use(serve('vendor'));

app.listen(PORT);

console.log('Listening on port %d', PORT);
