const master = require('./master');
const miner = require('./miner');
const registry = {
  master,
  miner,
};

module.exports.getTypeHandler = function (type) {
  return registry[type] || null;
};
