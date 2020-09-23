const get = require('lodash/get');
const pick = require('lodash/pick');
const session = require('cookie-session');
const passport = require('passport-restify');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const uuid = require('uuid');
const cookie = require('cookie');
const CookieParser = require('restify-cookies');

const {pickUserFields} = require('./util');
const conf = require('../../conf.json');
const fs=require('fs');

const {
    doQuery,
    findUser,
    addUser,
}=require('../lib/db');

const sessionName = 'egteam:sess';

function hashPass(p) {
    return p;
}

function validateUserPwd(user, pp) {
    return user && hashPass(pp) === get(user,'_doc.password');
}

function FacebookReqStore(options) {
    this.store = function(req, cb) {
        cb(null,get(req,'query.state'));
      };
      this.verify = function(req, providedState, cb) {
        cb(null, true);
      };
}

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    const cond = [];
    if (user.uuid) {
        cond.push({uuid:user.uuid});
    }
    if (user.email) {
        cond.push({email:user.email});
      }      
      findUser({
          id: user.uuid,
          email: user.email,
    }).then(found=>{                
        return done(null, found);         
    }).catch(err=> {
        console.log('auth error');
        console.log(err);
        return done(err); 
    }) 
  });


function initPassport(server) {
      
    server.use(CookieParser.parse);
    server.use(session({
        keys: conf.sessionKeys || ['key1xxxx', 'key2xxxxx'],
        name: sessionName,
	    maxage: 48 * 3600 /*hours*/ * 1000,  /*in milliseconds*/
	    secureProxy: false // if you do SSL outside of node
    }));
    
    server.use(passport.initialize());
    server.use(passport.session());

    passport.use(new LocalStrategy(
        function(username, password, done) {
            console.log(`Local auth finding user ${username}`);
            findUser({username}).then(found=>{        
                console.log(`Local auth finding user ${username} found is ${found}`);
                if (!validateUserPwd(found, password)) {
                    console.log(`Local auth finding user ${username} invalid`);
                    return done(null, false); 
                }
                console.log(`Local auth finding user ${username} good`);
                return done(null, found);
            }).catch(err=> {
                console.log('auth error');
                console.log(err);
                return next(err); 
            })      
        }
      ));

    const loginRedirectRoot = '/';
    const loginRedFunc = (req, res)=>{
        res.redirect(loginRedirectRoot, ()=>{});
    };
    server.post('/login', 
    (req, res,next)=>{
        passport.authenticate('local', {  }, (err, user)=>{
            if (err || !user) {
                res.statusCode = 401;
                return res.json({"error":"login failed"});
            }else {
                return req.login(user, {}, next);
            }
        })(req, res,next);
    },
        (req, res)=>{
            if (req.user) {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(res.statusCode);
                const setk = res.header('set-cookie') || [];
                const usr = pickUserFields(req.user);
                if (setk) {
                    const parsed = setk.map(cookie.parse);
                    parsed.reduce((acc,p)=>{
                        const session = p[req.sessionKey];
                        const sessionSig = p[`${req.sessionKey}.sig`];
                        if (session) {
                            return Object.assign(acc, {session});
                        }
                        if (sessionSig) {
                            return Object.assign(acc, {sessionSig});
                        }
                        return acc;
                    }, usr);
                    console.log(parsed);
                }
                res.end(JSON.stringify(usr));
            }else {
                res.json({
                    error:'not found'
                })
            }
        });

    /*
    server.post('/auth/addAuthSession', (req, res)=>{
        return queries.addAuthSession(req.body).then(r=>{
            res.json({id:r.id});
        });
    });
    server.post('/auth/getAuthSession', (req, res)=>{
        return queries.getAuthSession(req.body).then(r=>{
            res.setCookie(sessionName, r.session);
            res.setCookie(`${sessionName}.sig`, r.sessionSig);
            res.json(r);
        });
    });
*/
    passport.use(new FacebookStrategy(Object.assign({},conf.facebook,{
        profileFields: ['id', 'emails', 'name'],
        store: new FacebookReqStore(),
    }),
        function(accessToken, refreshToken, profile, cb) {
            const email = get(profile,'emails[0].value');
            const userData = {
                idOnProvider: profile.id,
                last_name: get(profile,'name.familyName'),
                first_name: get(profile,'name.givenName'),
                email,
                username: email,
                provider: profile.provider,
                uuid: uuid.v1(),
            };
            console.log(`facebook login ${userData.email}`);            
            return findUser({email: userData.email}).then(found=>{                        
                if (found) {
                    return cb(null, found);
                }else {
                    return addUser("Users", userData).then(()=>{
                        cb(null, userData);
                    });
                }
            }).catch(err=> {
                console.log('facebook auth error');
                console.log(err);
                return cb(err); 
            })      
        }
    ));

    server.use((req, res, next)=>{
        console.log(req.url);     
        const username = get(req,'username');
        const password = get(req,'authorization.basic.password');   
        if (username && password) {
            req.user = { usrname, password };
            findUser({username}).then(found=>{
                if (validateUserPwd(found,password)) {
                    req.user = found;
                }
                return next();   
            });
        }else
            return next();        
    }); 
    server.get('/auth/facebook', passport.authenticate('facebook'));
      
    server.get('/auth/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        (req, res)=>{
            const state = get(req, 'query.state');
            let error = 'Unknown Error';
            const session = req.cookies[`${req.sessionKey}`];
            const sessionSig = req.cookies[`${req.sessionKey}.sig`];
            try {
                if (state) {
                    const stateStr = Buffer.from(state,'base64');
                    const resJsp = JSON.parse(stateStr);
                    if (resJsp.url) {
                        return queries.updateAuthSession({
                            pub: resJsp.pub,
                            session,
                            sessionSig,
                            modified: new Date(),
                        }).then(()=>{                        
                            return res.redirect(resJsp.url,()=>{});
                        });
                    } else {
                        error = 'Invalid url';
                    }
                }
            } catch(err) {
                console.log('error on facebook callback');
                console.log(err);                
            }
            console.log(`Error on facebook redir ${error}`);
            return res.json({
                error
            });
            try {
                res.end(fs.readFileSync("./build/index.html"));
            } catch (err) {
                res.redirect(conf.ui.root, ()=>{});
            }
            //res.end(JSON.stringify({
            //  user: pick(req.user,['email','id']),  
            //  cookie: req.cookies[`${req.sessionKey}`],
            //  cookieKey: req.cookies[`${req.sessionKey}.sig`],
            //}));
        });
    
}

module.exports = {
    initPassport,
};