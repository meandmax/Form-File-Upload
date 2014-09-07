'use strict';

let fs = require('fs');
let parse = require('co-busboy');
let route = require('koa-route');
let serve = require('koa-static');
let koa   = require('koa');
let app   = koa();

const PORT = 8000;

var decodeBase64Image = function(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

// process file uploads
app.use(route.post('/process', function *() {
	if (this.request.is('multipart/*')) {
		let parts = parse(this);

		let part;

		while (part = yield parts) {
			if (part.length) {
				let type, name, value, key;

				let partsOfStr = part[0].split(':');

				if (partsOfStr[0] === 'file') {
					console.log(partsOfStr[0]);
					type = partsOfStr[0];
					name = partsOfStr[1];

					value = decodeBase64Image(part[1]);

					fs.writeFile('files/' + name, value.data, function(err) {
						console.log('Worked');
					});

				} else {
					key = part[0];
					value = part[1];
					console.log(key + ': ' + value);
				}

			} else {
				part.pipe(fs.createWriteStream('uploads/' + (part.filename || 'nofile')));
			}
		}
	}

	this.redirect('/');
}));

// static files
app.use(serve('demo'));

app.listen(PORT);

console.log('Listening on port %d', PORT);
