'use strict';

let fs = require('fs');
let parse = require('co-busboy');
let route = require('koa-route');
let serve = require('koa-static');
let koa   = require('koa');
let app   = koa();

const PORT = 3000;

// process file uploads
app.use(route.post('/process', function *() {
    if (this.request.is('multipart/*')) {
        let parts = parse(this);

        let part;

        while (part = yield parts) {
            if (part.length) {
                var key = part[0];
                var value = part[1];

                console.log(key + ': ' + value);
            } else {
                part.pipe(fs.createWriteStream('uploads/' + (part.filename || 'nofile')));
            }
        }
    }

    this.redirect('/');
}));

// static files
app.use(serve('demo'));
app.use(serve('vendor'));

app.listen(PORT);

console.log('Listening on port %d', PORT);
