const about = require('../controllers/about');
const model = require('../controllers/model');
const sql = require('../controllers/sql');
const routes = {
    '/doQuery': {
        method: 'get',
        func: sql.doQuery
    },
    '/getModel': {
        method: 'get',
        func: model.getModel,
    },
    '/sql/get': {
        method: 'post',
        func: sql.get,
    },
    '/sql/create': {
        method: 'post',
        func: sql.createOrUpdate,
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