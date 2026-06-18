const http = require('http');
const s = http.createServer(function(req, res) { res.end('ok'); });
s.listen(12345, '127.0.0.1', function() {
  console.log('listening on 127.0.0.1:12345');
  setTimeout(function() { s.close(); process.exit(0); }, 2000);
});
s.on('error', function(e) { console.log('ERROR:', e.message); process.exit(1); });
