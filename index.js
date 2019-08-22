const IS24 = require('./src/portals/is24');
const FlowFact = require('./src/portals/flowfact');
const { processEstate } = require('./src/portals/flowfact/utils');
const { deepRenameProps } = require('./src/lib');

module.exports = {
  FlowFact,
  IS24,
  utils: {
    deepRenameProps,
    processFlowFactEstate: processEstate,
  },
};
