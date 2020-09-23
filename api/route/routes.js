const about = require('../controllers/about');
const data = require('../controllers/data');

const routes = {
    '/getSheet' :{
        method: 'get',
        func: data.getSheet,
    },
    '/doQuery': {
        method: 'get',
        func: require('../controllers/sql').doQuery
    },
    '/version': {
        auth: false,
        method: 'get',
        func: about.version,
    },
};

module.exports = {
    routes,
};