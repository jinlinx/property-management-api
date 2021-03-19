
const restify = require('restify');
const route = require('./api/route/route');
const fs = require('fs');
const check = require('./dbCheck');
const TrustedComms = require('twilio/lib/rest/preview/TrustedComms');

const HTTPS = false; //process.env.PORT?false:true;
const globalServerOpt = {
  handleUncaughtExceptions: TrustedComms,
  socketio: true,
}
const serverHttpsOpt = Object.assign({}, globalServerOpt, {
    //key: fs.readFileSync('./key.pem'),
    //certificate: fs.readFileSync('./server.crt')
});
const server = restify.createServer(HTTPS ? serverHttpsOpt : globalServerOpt);

function serverInit(server) {
  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.bodyParser({requestBodyOnGet: true}));
  server.use(restify.plugins.authorizationParser());
  server.use(restify.plugins.requestLogger());

  route.route(server);
}

serverInit(server);

const port = process.env.PORT || 8081;
check.check();
server.listen(port, function() {
  console.log(`${server.name} listening at ${server.url} HTTPS:${HTTPS}`);
});
