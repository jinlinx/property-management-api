const get = require('lodash/get');
const pick = require('lodash/pick');

function pickUserFields(user) {
    const ru = pick(user, ['_id','username','uuid','email','idOnProvider','provider']);
    if (ru._id) ru.id = ru._id.toString();
    return ru;
}

function getUser(req) {
    return pickUserFields(get(req,'user'));
}

const formatterYYYYMMDD=str => `STR_TO_DATE('${str}','%Y-%m-%d')`;

const extensionFields = Object.freeze([{ field: 'created' }, { field: 'modified' }]);

module.exports = {
    pickUserFields,
    formatterYYYYMMDD,
    getUser,
    extensionFields,
};