var http = require('http')
var url = require('url')

var port = 3000;
var name = 'JSON API';

function parsetime (time) {
  return {
    hour: time.getHours(),
    minute: time.getMinutes(),
    second: time.getSeconds()
  }
}

function unixtime (time) {
  return { unixtime : time.getTime() }
}

var server = http.createServer(function (req, res) {
  var parsedUrl = url.parse(req.url, true)
  var time = new Date(parsedUrl.query.iso)

  var json = {'id': '1'};

  // if (/^\/api\/parsetime/.test(req.url))
  //   result = parsetime(time)
  // else if (/^\/api\/unixtime/.test(req.url))
  //   result = unixtime(time)

  if (json) {
    res.writeHead(200, { 'Content-Type': 'application/json'})
    res.end(JSON.stringify(json));
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(function() {
  address = server.address();
  console.log("opened server on %j", address);
});
