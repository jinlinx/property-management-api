const keys = require('lodash/keys');

const routes = require('./routes').routes;
const patuh = require('../util/pauth');
const restify = require('restify');

function addCORS(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
}
module.exports = {
    route: server=>{
        server.opts("/*", function (req,res,next) {
            addCORS(req, res);
            res.send(200);
            return next();
        });

        server.use((req, res, next)=>{
            const egcookie = req.headers['egcookie'];
            if (egcookie) {
                req.headers['cookie'] = egcookie;
            }
            return next(); 
        }); 
        
        const rts = keys(routes);
        rts.forEach(url=>{
            const op = routes[url];
            server[op.method](url, op.func);
        });

        patuh.initPassport(server);
        server.use((req, res, next)=>{
            if (req.method !== 'GET' && req.method !== 'POST') return next();
            addCORS(req, res);
            const controller = routes[req.url];
            if (controller && controller.auth !== false) {
                if (!req.user) {
                    res.send(401, 'Unauthorized');
                    return next(false);
                }
            }
            return next(); 
        }); 

        //server.get('/*', restify.plugins.serveStatic({
        //    directory: `${__dirname}/../../build`,
        //    default: 'index.html'
        //  }));        

    }
};