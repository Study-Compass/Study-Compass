const { override, addBabelPlugin } = require('customize-cra');

module.exports = override(
  addBabelPlugin('@react-optimized-image/plugin')
  // You can add more customizations here using other `customize-cra` functions.
);
