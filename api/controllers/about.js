const ver = require('../../version');
function version(req, res) {
    const date = new Date();
    console.log(`version ${date}`);
    return res.send(ver);    
}

module.exports = {   
    version,
};