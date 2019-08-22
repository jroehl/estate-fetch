const IS24 = require('./portals/is24');
const FlowFact = require('./portals/flowfact');
const { processEstate } = require('./portals/flowfact/utils');
const { deepRenameProps } = require('./lib');

module.exports = {
  FlowFact,
  IS24,
  utils: {
    deepRenameProps,
    processFlowFactEstate: processEstate,
  },
};
