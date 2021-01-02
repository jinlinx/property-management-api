const models = require('../models/index');

async function getModel(req, res) {
  try {
    console.log(`getModel -> ${req.query.name}`);
        const m = models[req.query.name];
      console.log(`getModel done ${req.query.name}`);
      return res.json(m);
    } catch (err) {
      console.log('getModel Error');
      console.log(err);
      res.send(500, {
        name: req.query.name,
        message: err.message,
       errors: err.errors
      });
    }
}
  
module.exports = {
  getModel,
}