const FlowFact = require('../portals/flowfact');
const IS24 = require('../portals/is24');

const portals = {
  flowfact: FlowFact,
  ff: FlowFact,
  is24: IS24,
  immobilienscout24: IS24,
};

module.exports = async ([, , portalString = '']) => {
  const Portal = portals[portalString.toLowerCase()];
  if (!Portal) throw 'Please specify valid portal (flowfact or immobilienscout24)';
  const portal = new Portal();
  const estates = await portal.getEstates();
  console.log(JSON.stringify(estates, null, 2));
  return estates;
};
