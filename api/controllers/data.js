const get = require('lodash/get');
const sheet = require('../lib/getSheet').createSheet();

async function readSheet(tab) {
  const res = await sheet.readRanges('1lXOIPkIhpMRLtQTg7CXkhE2M3__vJmGkwlHKTNk1rO4', [`'${tab}'!A:E`]);
  const data = get(res, 'data.valueRanges.0.values');
  return data;
}

async function getSheet(req, res) {
  try {
    const dataAll = await readSheet(req.query.tab);
    const headers = dataAll.slice(0, 1)[0];
    const data = dataAll.slice(1);

    return res.json(data.map(d => {
      return d.reduce((acc, d, i) => {
        acc[headers[i]] = d;
        return acc;
      }, {});
    }));
  } catch (err) {
    //console.log(err);
    res.send(500, {
      tab: req.query.tab,
      message: err.message,
     errors: err.errors
    });
  }
}

module.exports = {   
  getSheet,
};

