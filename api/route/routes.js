const about = require('../controllers/about');
const model = require('../controllers/model');
const sql=require('../controllers/sql');
const calc = require('../controllers/calc');
const email = require('../controllers/email');
const statement = require('../controllers/statements');
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
    '/sql/getDatabases': {
        method: 'get',
        func: sql.getDatabases,
    },
    '/sql/getTables': {
        method: 'get',
        func: sql.getTables,
    },
    '/sql/getTableInfo': {
        method: 'get',
        func: sql.getTableInfo,
    },
    '/sql/freeFormSql': {
        method: 'post',
        func: sql.freeFormSql,
    },
    '/sql/importPayment': {
        method: 'post',
        func: sql.importPayment,
    },
    '/calc/calc': {
        method: 'get',
        func: calc.calcMonthly,
    },
    '/calc/settle': {
        method: 'get',
        func: calc.settleMonthly,
    },
    '/util/sendMail': {
        method: 'post',
        func: email.sendEmail,
    },
    '/misc/statement': {
        method: 'get',
      func:statement.doStatement,  
    },
    '/misc/getStatementProcessingMsg': {
        method: 'get',
        func: statement.getStatementProcessingMsg,  
    },
    '/misc/gsimport': {
        method: 'get',
        func: statement.doGsImport,
    },
    '/misc/matchPayments': {
        method: 'post',
        func: statement.matchPayments,
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