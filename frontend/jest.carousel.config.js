/**
 * Carousel tests, plus the voice editor they reuse.
 *
 * A standalone config because the repo-wide `npm test` fails at setup. It takes
 * the app's own jest settings from package.json and overrides only which files
 * to run, so these execute under the same transforms and setup as everything
 * else rather than under a hand-rolled approximation.
 *
 *   npx jest -c jest.carousel.config.js
 */
const base = require('./package.json').jest;

module.exports = {
  ...base,
  rootDir: __dirname,
  testMatch: [
    '<rootDir>/src/pages/PlatformAdmin/PivotTenantDashboard/carousel/**/*.test.{js,jsx}',
    '<rootDir>/src/pages/PlatformAdmin/PivotTenantDashboard/PivotVoicePage.test.jsx',
  ],
};
