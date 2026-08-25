module.exports = {
  default: {
    require: ['steps/**/*.ts'],
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register'],
    format: ['progress', 'html:reports/cucumber-report.html'],
    parallel: 1
  }
};
