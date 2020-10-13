const about = require('../controllers/about');
const model = require('../controllers/model');
const sql=require('../controllers/sql');
const calc=require('../controllers/calc');
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
        func: sql.doGet,
    },
    '/sql/create': {
        method: 'post',
        func: sql.createOrUpdate,
    },
    '/sql/del': {
        method: 'post',
        func: sql.del,
    },
    '/calc/calc': {
        method: 'get',
        func: calc.calcMonthly,
    },
    '/calc/settle': {
        method: 'get',
        func: calc.settleMonthly,
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